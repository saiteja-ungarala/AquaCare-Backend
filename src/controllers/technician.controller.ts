import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
import { TechnicianService } from '../services/technician.service';

const getTechnicianIdFromRequest = (req: Request): number => {
    const rawId = (req.user as any)?.id;
    return Number(rawId);
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.getMe(technicianId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const uploadKyc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const files = (req.files as Express.Multer.File[]) || [];
        if (!Array.isArray(files) || files.length === 0) {
            throw { type: 'AppError', message: 'At least one document file is required', statusCode: 400 };
        }

        const fileUrls = files.map((file) => `/uploads/technician-kyc/${file.filename}`);
        const result = await TechnicianService.submitKyc(technicianId, {
            docType: req.body.doc_type,
            fileUrls,
        });
        return successResponse(res, result, 'KYC submitted', 201);
    } catch (error) {
        next(error);
    }
};

export const patchOnline = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.setOnlineStatus(technicianId, req.body.is_online);
        return successResponse(res, result, 'Online status updated');
    } catch (error) {
        next(error);
    }
};

export const getAvailableJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.getAvailableJobs(technicianId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const acceptJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const bookingId = Number(req.params.id);
        const result = await TechnicianService.acceptJob(technicianId, bookingId);
        return successResponse(res, result, 'Job accepted');
    } catch (error) {
        next(error);
    }
};

export const rejectJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const bookingId = Number(req.params.id);
        const result = await TechnicianService.rejectJob(technicianId, bookingId);
        return successResponse(res, result, 'Job rejected');
    } catch (error) {
        next(error);
    }
};

export const patchJobStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const bookingId = Number(req.params.id);
        const result = await TechnicianService.updateJobStatus(technicianId, bookingId, req.body.status);
        return successResponse(res, result, 'Job status updated');
    } catch (error) {
        next(error);
    }
};

export const getReferral = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.getReferral(technicianId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getEarningsSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.getEarningsSummary(technicianId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getEarningCampaigns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await TechnicianService.getActiveCampaigns();
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getProductCommissionPreview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await TechnicianService.getProductCommissionPreview();
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getCampaignProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const campaignId = Number(req.params.campaignId);
        const result = await TechnicianService.getCampaignProgress(technicianId, campaignId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const patchLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const result = await TechnicianService.updateLocation(technicianId, req.body.lat, req.body.lng);
        return successResponse(res, result, 'Location updated');
    } catch (error) {
        next(error);
    }
};

export const getJobUpdates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const bookingId = Number(req.params.bookingId);
        const result = await TechnicianService.getJobUpdates(technicianId, bookingId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const postJobUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const technicianId = getTechnicianIdFromRequest(req);
        const bookingId = Number(req.params.bookingId);
        const result = await TechnicianService.postJobUpdate(technicianId, bookingId, req.body);
        return successResponse(res, result, 'Update posted', 201);
    } catch (error) {
        next(error);
    }
};
