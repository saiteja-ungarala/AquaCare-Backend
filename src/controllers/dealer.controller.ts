import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
import { DealerService } from '../services/dealer.service';

const getDealerIdFromRequest = (req: Request): number => {
    return Number((req.user as any)?.id);
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dealerId = getDealerIdFromRequest(req);
        const result = await DealerService.getMe(dealerId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const uploadKyc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dealerId = getDealerIdFromRequest(req);
        const files = (req.files as Express.Multer.File[]) || [];
        if (!Array.isArray(files) || files.length === 0) {
            throw { type: 'AppError', message: 'At least one document file is required', statusCode: 400 };
        }

        const fileUrls = files.map((file) => `/uploads/dealer-kyc/${file.filename}`);
        const result = await DealerService.submitKyc(dealerId, {
            docType: req.body.doc_type,
            fileUrls,
        });
        return successResponse(res, result, 'Dealer KYC submitted', 201);
    } catch (error) {
        next(error);
    }
};

export const patchStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dealerId = getDealerIdFromRequest(req);
        const result = await DealerService.patchStatus(dealerId, req.body);
        return successResponse(res, result, 'Dealer profile updated');
    } catch (error) {
        next(error);
    }
};

export const getPricingProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dealerId = getDealerIdFromRequest(req);
        const result = await DealerService.getPricingProducts(dealerId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getPricingByProductId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dealerId = getDealerIdFromRequest(req);
        const productId = Number(req.params.productId);
        const result = await DealerService.getPricingByProductId(dealerId, productId);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

