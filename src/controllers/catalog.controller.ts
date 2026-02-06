import { Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalog.service';
import { successResponse } from '../utils/response';

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await CatalogService.getServices(req.query);
        return successResponse(res, result.data, 'Services fetched'); // Simplified response wrapper might need adjustment for pagination in root
        // For now returning data directly inside standard wrapper.
        // Ideally pagination metadata should be top level or part of data wrapper.
        // Let's adhere to "Consistent response format { success: true, data }"
        // So data will contain { list, pagination }
    } catch (error) {
        next(error);
    }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await CatalogService.getServiceById(Number(req.params.id));
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await CatalogService.getProducts(req.query);
        return successResponse(res, result.data);
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await CatalogService.getProductById(Number(req.params.id));
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};
