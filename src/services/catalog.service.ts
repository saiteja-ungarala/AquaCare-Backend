import { ServiceModel } from '../models/service.model';
import { ProductModel } from '../models/product.model';

export const CatalogService = {
    async getServices(query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.pageSize as string) || 10;
        const offset = (page - 1) * limit;

        const { services, total } = await ServiceModel.findAll({
            category: query.category as string,
            search: query.searchQuery as string,
            limit,
            offset,
        });

        return {
            data: services,
            pagination: {
                page,
                pageSize: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getServiceById(id: number) {
        const service = await ServiceModel.findById(id);
        if (!service) throw { type: 'AppError', message: 'Service not found', statusCode: 404 };
        return service;
    },

    async getProducts(query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.pageSize as string) || 10;
        const offset = (page - 1) * limit;

        const { products, total } = await ProductModel.findAll({
            category: query.category as string,
            search: query.searchQuery as string,
            limit,
            offset,
        });

        return {
            data: products,
            pagination: {
                page,
                pageSize: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getProductById(id: number) {
        const product = await ProductModel.findById(id);
        if (!product) throw { type: 'AppError', message: 'Product not found', statusCode: 404 };
        return product;
    },
};
