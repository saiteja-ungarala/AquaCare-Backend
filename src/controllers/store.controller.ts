import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/store.service';
import { successResponse } from '../utils/response';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await StoreService.getCategories();
        return successResponse(res, categories);
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = {
            category: req.query.category as string | undefined,
            q: req.query.q as string | undefined,
            sort: req.query.sort as 'popular' | 'new' | 'price_asc' | 'price_desc' | undefined,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
        };

        const result = await StoreService.getProducts(params);
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            throw { type: 'AppError', message: 'Invalid product ID', statusCode: 400 };
        }

        const product = await StoreService.getProductById(id);
        if (!product) {
            throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
        }

        return successResponse(res, product);
    } catch (error) {
        next(error);
    }
};
