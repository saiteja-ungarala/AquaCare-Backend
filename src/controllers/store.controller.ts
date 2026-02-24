import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { ProductQueryParams, StoreService } from '../services/store.service';
import { successResponse } from '../utils/response';

const getBaseServerUrl = (req: Request): string => {
    const configuredBase = String(env.BASE_SERVER_URL || '').trim();
    if (configuredBase) {
        return configuredBase.replace(/\/+$/, '');
    }

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = req.get('host');

    if (!host) return '';
    return `${protocol}://${host}`;
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await StoreService.getCategories();
        return successResponse(res, categories);
    } catch (error) {
        next(error);
    }
};

export const getBrandsByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = Number(req.params.categoryId);
        const brands = await StoreService.getBrandsByCategory(categoryId);
        return successResponse(res, brands);
    } catch (error) {
        next(error);
    }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query as unknown as ProductQueryParams;
        const params: ProductQueryParams = {
            category_id: query.category_id ? Number(query.category_id) : undefined,
            brand_id: query.brand_id ? Number(query.brand_id) : undefined,
            category: query.category,
            search: query.search,
            sort: query.sort,
            page: query.page ? Number(query.page) : 1,
            limit: query.limit ? Number(query.limit) : 20,
        };

        const result = await StoreService.getProducts(params, getBaseServerUrl(req));
        return successResponse(res, result);
    } catch (error) {
        next(error);
    }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);

        const product = await StoreService.getProductById(id, getBaseServerUrl(req));
        if (!product) {
            throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
        }

        return successResponse(res, product);
    } catch (error) {
        next(error);
    }
};
