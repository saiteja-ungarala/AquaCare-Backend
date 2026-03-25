import pool from '../config/db';
import { BOOKING_STATUS } from '../config/constants';
import { TechnicianModel } from '../models/technician.model';
import { UserModel } from '../models/user.model';
import { BookingUpdateModel } from '../models/booking-update.model';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
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

const VALID_TECHNICIAN_TRANSITIONS: Record<string, string> = {
    [BOOKING_STATUS.ASSIGNED]: BOOKING_STATUS.IN_PROGRESS,
    [BOOKING_STATUS.IN_PROGRESS]: BOOKING_STATUS.COMPLETED,
};

export const TechnicianService = {
    async getMe(technicianId: number) {
        await TechnicianModel.ensureProfile(technicianId);
        const referralCode = await TechnicianModel.ensureReferralCode(technicianId);
        const profile = await TechnicianModel.getProfile(technicianId);
        if (!profile) {
            throw { type: 'AppError', message: 'Technician profile not found', statusCode: 404 };
        }

        const latestKyc = await TechnicianModel.getLatestKyc(technicianId);
        const kycCounts = await TechnicianModel.getKycCounts(technicianId);

        return {
            profile: {
                user_id: profile.user_id,
                full_name: profile.full_name,
                phone: profile.phone,
                verification_status: profile.verification_status,
                rejection_reason: profile.verification_status === 'rejected' ? (latestKyc?.review_notes ?? null) : null,
                suspension_reason: profile.verification_status === 'suspended' ? (latestKyc?.review_notes ?? null) : null,
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

    async getReferral(technicianId: number) {
        const referralCode = await ReferralCommissionService.getTechnicianReferralCode(technicianId);
        return { referral_code: referralCode };
    },

    async getEarningsSummary(technicianId: number) {
        return ReferralCommissionService.getTechnicianEarningsSummary(technicianId);
    },

    async getActiveCampaigns() {
        return ReferralCommissionService.getActiveCampaignsWithTiers();
    },

    async getProductCommissionPreview() {
        return ReferralCommissionService.getProductsCommissionPreview();
    },

    async getCampaignProgress(technicianId: number, campaignId: number) {
        return ReferralCommissionService.getCampaignProgress(technicianId, campaignId);
    },

    async updateLocation(technicianId: number, lat: number, lng: number) {
        await TechnicianModel.ensureProfile(technicianId);
        await pool.query(
            'UPDATE technician_profiles SET base_lat = ?, base_lng = ? WHERE user_id = ?',
            [lat, lng, technicianId]
        );
        return { success: true };
    },

    async submitKyc(technicianId: number, payload: { docType?: string; fileUrls: string[] }) {
        await TechnicianModel.ensureProfile(technicianId);

        if (payload.fileUrls.length === 0) {
            throw { type: 'AppError', message: 'At least one document is required', statusCode: 400 };
        }

        const normalizedDocType = normalizeKycDocType(payload.docType);
        await TechnicianModel.insertKycDocuments(
            technicianId,
            payload.fileUrls.map((fileUrl) => ({
                doc_type: normalizedDocType,
                file_url: fileUrl,
            }))
        );
        await TechnicianModel.setVerificationStatus(technicianId, 'pending');

        return {
            uploaded: payload.fileUrls.length,
            verification_status: 'pending',
        };
    },

    async setOnlineStatus(technicianId: number, isOnline: boolean) {
        await TechnicianModel.ensureProfile(technicianId);
        const profile = await TechnicianModel.getProfile(technicianId);
        if (!profile) {
            throw { type: 'AppError', message: 'Technician profile not found', statusCode: 404 };
        }

        if (profile.verification_status !== 'approved') {
            throw { type: 'AppError', message: 'Technician is not approved for going online', statusCode: 403 };
        }

        if (isOnline && profile.base_lat === null) {
            throw { type: 'AppError', message: 'Please enable location before going online', statusCode: 400, code: 'LOCATION_REQUIRED' };
        }

        await TechnicianModel.setOnline(technicianId, isOnline);
        return { is_online: isOnline };
    },

    async getAvailableJobs(technicianId: number) {
        await TechnicianModel.ensureProfile(technicianId);
        const profile = await TechnicianModel.getProfile(technicianId);
        if (!profile) {
            throw { type: 'AppError', message: 'Technician profile not found', statusCode: 404 };
        }

        const myJobs = await TechnicianModel.getMyAssignedJobs(technicianId);

        // Offline technicians only see their own active jobs — no new available jobs
        if (!profile.is_online) {
            return {
                jobs: myJobs,
                meta: { distance_filter_applied: false, note: 'Offline: only active jobs shown.' },
            };
        }

        if (profile.base_lat === null || profile.base_lng === null) {
            console.warn(`[TechnicianService] Technician ${technicianId} has no base coordinates. Returning available jobs without distance filter.`);
            const availableJobs = await TechnicianModel.getAvailableJobsWithoutDistance(technicianId);
            const jobsMap = new Map<number, any>();
            [...availableJobs, ...myJobs].forEach((job) => jobsMap.set(Number(job.id), job));
            const jobs = Array.from(jobsMap.values()).sort((a, b) => {
                const aDate = new Date(a.created_at || 0).getTime();
                const bDate = new Date(b.created_at || 0).getTime();
                return bDate - aDate;
            });
            return {
                jobs,
                meta: {
                    distance_filter_applied: false,
                    note: 'Technician base coordinates are missing; distance filter was skipped.',
                },
            };
        }

        const availableJobs = await TechnicianModel.getAvailableJobsWithinRadius({
            technicianId,
            baseLat: Number(profile.base_lat),
            baseLng: Number(profile.base_lng),
            radiusKm: Number(profile.service_radius_km || 0),
        });
        const jobsMap = new Map<number, any>();
        [...availableJobs, ...myJobs].forEach((job) => jobsMap.set(Number(job.id), job));
        const jobs = Array.from(jobsMap.values()).sort((a, b) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate;
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

    async getJobUpdates(technicianId: number, bookingId: number) {
        const updates = await TechnicianModel.getJobUpdates(bookingId, technicianId);
        return { updates };
    },

    async acceptJob(technicianId: number, bookingId: number) {
        // Pre-flight checks before acquiring the row lock
        await TechnicianModel.ensureProfile(technicianId);
        const techProfile = await TechnicianModel.getProfile(technicianId);
        if (!techProfile) {
            throw { type: 'AppError', message: 'Technician profile not found', statusCode: 404 };
        }
        if (!techProfile.is_online) {
            throw { type: 'AppError', message: 'You must be online to accept jobs', statusCode: 400 };
        }
        if (await TechnicianModel.hasActiveJob(technicianId)) {
            throw { type: 'AppError', message: 'Complete your current active job before accepting a new one', statusCode: 409 };
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [bookingRows] = await connection.query<any[]>(
                `SELECT id, user_id, technician_id, status
                 FROM bookings
                 WHERE id = ?
                 FOR UPDATE`,
                [bookingId]
            );

            if (bookingRows.length === 0) {
                throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
            }

            const booking = bookingRows[0];
            if (booking.technician_id !== null) {
                throw { type: 'AppError', message: 'Booking already assigned', statusCode: 409 };
            }
            if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
                throw { type: 'AppError', message: 'Booking is not available for acceptance', statusCode: 400 };
            }

            const [offerRows] = await connection.query<any[]>(
                `SELECT id FROM booking_offers WHERE booking_id = ? AND technician_id = ? FOR UPDATE`,
                [bookingId, technicianId]
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
                    `INSERT INTO booking_offers (booking_id, technician_id, status, offered_at, responded_at)
                     VALUES (?, ?, 'accepted', NOW(), NOW())`,
                    [bookingId, technicianId]
                );
            }

            await connection.query(
                `UPDATE bookings
                 SET technician_id = ?, status = ?, assigned_at = NOW()
                 WHERE id = ?`,
                [technicianId, BOOKING_STATUS.ASSIGNED, bookingId]
            );

            await connection.commit();

            const customerUserId = Number(booking.user_id);
            Promise.all([
                UserModel.findById(customerUserId),
                TechnicianModel.getProfile(technicianId),
            ]).then(([customer, technicianProfile]) => {
                const technicianName = technicianProfile?.full_name ?? 'Your technician';
                if (customer?.email) {
                    EmailService.sendBookingAssigned(customer.email, {
                        bookingId,
                        technicianName,
                    });
                }
                NotificationService.sendToUser(customerUserId, 'Technician Assigned', `${technicianName} is on the way`, { type: 'technician_assigned', bookingId });
            }).catch((err) => console.error('[TechnicianService] acceptJob notification error:', err));

            return {
                booking_id: bookingId,
                status: BOOKING_STATUS.ASSIGNED,
                technician_id: technicianId,
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async rejectJob(technicianId: number, bookingId: number) {
        const [bookingRows] = await pool.query<any[]>(
            `SELECT id FROM bookings WHERE id = ?`,
            [bookingId]
        );
        if (bookingRows.length === 0) {
            throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        }

        const [offerRows] = await pool.query<any[]>(
            `SELECT id FROM booking_offers WHERE booking_id = ? AND technician_id = ?`,
            [bookingId, technicianId]
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
                `INSERT INTO booking_offers (booking_id, technician_id, status, offered_at, responded_at)
                 VALUES (?, ?, 'rejected', NOW(), NOW())`,
                [bookingId, technicianId]
            );
        }

        return { booking_id: bookingId, status: 'rejected' };
    },

    async postJobUpdate(technicianId: number, bookingId: number, data: { update_type: string; note?: string; media_url?: string }) {
        const [bookingRows] = await pool.query<any[]>(
            'SELECT id, user_id, technician_id, status, price FROM bookings WHERE id = ?',
            [bookingId]
        );

        if (bookingRows.length === 0) {
            throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        }

        const booking = bookingRows[0];
        if (Number(booking.technician_id) !== technicianId) {
            throw { type: 'AppError', message: 'You are not assigned to this booking', statusCode: 403 };
        }

        const updateId = await BookingUpdateModel.create({
            booking_id: bookingId,
            technician_id: technicianId,
            update_type: data.update_type as 'arrived' | 'diagnosed' | 'in_progress' | 'completed' | 'photo' | 'note',
            note: data.note || null,
            media_url: data.media_url || null,
        });

        if (data.update_type === 'arrived') {
            NotificationService.sendToUser(Number(booking.user_id), 'Technician Arrived', 'Your technician is here', { type: 'booking_update', bookingId });
        }

        if (data.update_type === 'completed') {
            await pool.query(
                'UPDATE bookings SET status = ?, completed_at = NOW() WHERE id = ?',
                [BOOKING_STATUS.COMPLETED, bookingId]
            );

            UserModel.findById(Number(booking.user_id)).then((customer) => {
                if (customer?.email) {
                    EmailService.sendBookingCompleted(customer.email, {
                        bookingId,
                        amount: Number(booking.price ?? 0),
                    });
                }
                NotificationService.sendToUser(Number(booking.user_id), 'Service Complete', 'Please rate your experience', { type: 'booking_completed', bookingId });
            }).catch((err) => console.error('[TechnicianService] postJobUpdate notification error:', err));
        }

        return { success: true, update_id: updateId };
    },

    async updateJobStatus(technicianId: number, bookingId: number, status: string) {
        const [rows] = await pool.query<any[]>(
            `SELECT id, user_id, technician_id, status, price
             FROM bookings
             WHERE id = ?`,
            [bookingId]
        );

        if (rows.length === 0) {
            throw { type: 'AppError', message: 'Booking not found', statusCode: 404 };
        }

        const booking = rows[0];
        if (Number(booking.technician_id) !== technicianId) {
            throw { type: 'AppError', message: 'You are not assigned to this booking', statusCode: 403 };
        }

        const nextAllowedStatus = VALID_TECHNICIAN_TRANSITIONS[booking.status];
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
             WHERE id = ? AND technician_id = ?`,
            [status, bookingId, technicianId]
        );

        if (status === BOOKING_STATUS.COMPLETED) {
            UserModel.findById(Number(booking.user_id)).then((customer) => {
                if (customer?.email) {
                    EmailService.sendBookingCompleted(customer.email, {
                        bookingId,
                        amount: Number(booking.price ?? 0),
                    });
                }
            }).catch((err) => console.error('[TechnicianService] updateJobStatus email error:', err));
        }

        return {
            booking_id: bookingId,
            status,
            technician_id: technicianId,
        };
    },
};
