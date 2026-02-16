import pool from '../config/db';
import { BOOKING_STATUS } from '../config/constants';
import { AgentModel } from '../models/agent.model';
import { ReferralCommissionService } from './referralCommission.service';

const KYC_DOC_TYPE_ALIASES: Record<string, 'aadhaar' | 'pan' | 'driving_license' | 'selfie' | 'other'> = {
    government_id: 'other',
    license: 'driving_license',
    aadhaar: 'aadhaar',
    pan: 'pan',
    driving_license: 'driving_license',
    selfie: 'selfie',
    other: 'other',
};

const normalizeKycDocType = (input?: string): 'aadhaar' | 'pan' | 'driving_license' | 'selfie' | 'other' => {
    const key = (input || '').trim().toLowerCase();
    return KYC_DOC_TYPE_ALIASES[key] || 'other';
};

const VALID_AGENT_TRANSITIONS: Record<string, string> = {
    [BOOKING_STATUS.ASSIGNED]: BOOKING_STATUS.IN_PROGRESS,
    [BOOKING_STATUS.IN_PROGRESS]: BOOKING_STATUS.COMPLETED,
};

export const AgentService = {
    async getMe(agentId: number) {
        await AgentModel.ensureProfile(agentId);
        const referralCode = await AgentModel.ensureReferralCode(agentId);
        const profile = await AgentModel.getProfile(agentId);
        if (!profile) {
            throw { type: 'AppError', message: 'Agent profile not found', statusCode: 404 };
        }

        const latestKyc = await AgentModel.getLatestKyc(agentId);
        const kycCounts = await AgentModel.getKycCounts(agentId);

        return {
            profile: {
                user_id: profile.user_id,
                full_name: profile.full_name,
                phone: profile.phone,
                verification_status: profile.verification_status,
                is_online: !!profile.is_online,
                service_radius_km: Number(profile.service_radius_km || 0),
                base_lat: profile.base_lat,
                base_lng: profile.base_lng,
                last_online_at: profile.last_online_at,
                referral_code: referralCode,
            },
            kyc: {
                verification_status: profile.verification_status,
                latest_document: latestKyc,
                counts: kycCounts,
            },
        };
    },

    async getReferral(agentId: number) {
        const referralCode = await ReferralCommissionService.getAgentReferralCode(agentId);
        return { referral_code: referralCode };
    },

    async getEarningsSummary(agentId: number) {
        return ReferralCommissionService.getAgentEarningsSummary(agentId);
    },

    async getActiveCampaigns() {
        return ReferralCommissionService.getActiveCampaignsWithTiers();
    },

    async getProductCommissionPreview() {
        return ReferralCommissionService.getProductsCommissionPreview();
    },

    async getCampaignProgress(agentId: number, campaignId: number) {
        return ReferralCommissionService.getCampaignProgress(agentId, campaignId);
    },

    async submitKyc(agentId: number, payload: { docType?: string; fileUrls: string[] }) {
        await AgentModel.ensureProfile(agentId);

        if (payload.fileUrls.length === 0) {
            throw { type: 'AppError', message: 'At least one document is required', statusCode: 400 };
        }

        const normalizedDocType = normalizeKycDocType(payload.docType);
        await AgentModel.insertKycDocuments(
            agentId,
            payload.fileUrls.map((fileUrl) => ({
                doc_type: normalizedDocType,
                file_url: fileUrl,
            }))
        );
        await AgentModel.setVerificationStatus(agentId, 'pending');

        return {
            uploaded: payload.fileUrls.length,
            verification_status: 'pending',
        };
    },

    async setOnlineStatus(agentId: number, isOnline: boolean) {
        await AgentModel.ensureProfile(agentId);
        const profile = await AgentModel.getProfile(agentId);
        if (!profile) {
            throw { type: 'AppError', message: 'Agent profile not found', statusCode: 404 };
        }

        if (profile.verification_status !== 'approved') {
            throw { type: 'AppError', message: 'Agent is not approved for going online', statusCode: 403 };
        }

        await AgentModel.setOnline(agentId, isOnline);
        return { is_online: isOnline };
    },

    async getAvailableJobs(agentId: number) {
        await AgentModel.ensureProfile(agentId);
        const profile = await AgentModel.getProfile(agentId);
        if (!profile) {
            throw { type: 'AppError', message: 'Agent profile not found', statusCode: 404 };
        }

        if (profile.base_lat === null || profile.base_lng === null) {
            console.warn(`[AgentService] Agent ${agentId} has no base coordinates. Returning available jobs without distance filter.`);
            const jobs = await AgentModel.getAvailableJobsWithoutDistance(agentId);
            return {
                jobs,
                meta: {
                    distance_filter_applied: false,
                    note: 'Agent base coordinates are missing; distance filter was skipped.',
                },
            };
        }

        const jobs = await AgentModel.getAvailableJobsWithinRadius({
            agentId,
            baseLat: Number(profile.base_lat),
            baseLng: Number(profile.base_lng),
            radiusKm: Number(profile.service_radius_km || 0),
        });

        return {
            jobs,
            meta: {
                distance_filter_applied: true,
                base_lat: Number(profile.base_lat),
                base_lng: Number(profile.base_lng),
                service_radius_km: Number(profile.service_radius_km || 0),
            },
        };
    },

    async acceptJob(agentId: number, bookingId: number) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [bookingRows] = await connection.query<any[]>(
                `SELECT id, agent_id, status
                 FROM bookings
                 WHERE id = ?
                 FOR UPDATE`,
                [bookingId]
            );

            if (bookingRows.length === 0) {
                throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
            }

            const booking = bookingRows[0];
            if (booking.agent_id !== null) {
                throw { type: 'AppError', message: 'Booking already assigned', statusCode: 409 };
            }
            if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
                throw { type: 'AppError', message: 'Booking is not available for acceptance', statusCode: 400 };
            }

            const [offerRows] = await connection.query<any[]>(
                `SELECT id FROM booking_offers WHERE booking_id = ? AND agent_id = ? FOR UPDATE`,
                [bookingId, agentId]
            );

            if (offerRows.length > 0) {
                await connection.query(
                    `UPDATE booking_offers
                     SET status = 'accepted', responded_at = NOW()
                     WHERE id = ?`,
                    [offerRows[0].id]
                );
            } else {
                await connection.query(
                    `INSERT INTO booking_offers (booking_id, agent_id, status, offered_at, responded_at)
                     VALUES (?, ?, 'accepted', NOW(), NOW())`,
                    [bookingId, agentId]
                );
            }

            await connection.query(
                `UPDATE bookings
                 SET agent_id = ?, status = ?, assigned_at = NOW()
                 WHERE id = ?`,
                [agentId, BOOKING_STATUS.ASSIGNED, bookingId]
            );

            await connection.commit();

            return { booking_id: bookingId, status: BOOKING_STATUS.ASSIGNED, agent_id: agentId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async rejectJob(agentId: number, bookingId: number) {
        const [bookingRows] = await pool.query<any[]>(
            `SELECT id FROM bookings WHERE id = ?`,
            [bookingId]
        );
        if (bookingRows.length === 0) {
            throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        }

        const [offerRows] = await pool.query<any[]>(
            `SELECT id FROM booking_offers WHERE booking_id = ? AND agent_id = ?`,
            [bookingId, agentId]
        );

        if (offerRows.length > 0) {
            await pool.query(
                `UPDATE booking_offers
                 SET status = 'rejected', responded_at = NOW()
                 WHERE id = ?`,
                [offerRows[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO booking_offers (booking_id, agent_id, status, offered_at, responded_at)
                 VALUES (?, ?, 'rejected', NOW(), NOW())`,
                [bookingId, agentId]
            );
        }

        return { booking_id: bookingId, status: 'rejected' };
    },

    async updateJobStatus(agentId: number, bookingId: number, status: string) {
        const [rows] = await pool.query<any[]>(
            `SELECT id, agent_id, status
             FROM bookings
             WHERE id = ?`,
            [bookingId]
        );

        if (rows.length === 0) {
            throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        }

        const booking = rows[0];
        if (Number(booking.agent_id) !== agentId) {
            throw { type: 'AppError', message: 'You are not assigned to this booking', statusCode: 403 };
        }

        const nextAllowedStatus = VALID_AGENT_TRANSITIONS[booking.status];
        if (!nextAllowedStatus || nextAllowedStatus !== status) {
            throw {
                type: 'AppError',
                message: `Invalid status transition from ${booking.status} to ${status}`,
                statusCode: 400,
            };
        }

        await pool.query(
            `UPDATE bookings
             SET status = ?
             WHERE id = ? AND agent_id = ?`,
            [status, bookingId, agentId]
        );

        return { booking_id: bookingId, status };
    },
};
