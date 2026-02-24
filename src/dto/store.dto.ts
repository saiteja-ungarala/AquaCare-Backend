import { z } from 'zod';

const positiveInt = z.coerce.number().int().positive();

export const StoreBrandsByCategorySchema = z.object({
    params: z.object({
        categoryId: positiveInt,
    }),
});

export const StoreProductsQuerySchema = z.object({
    query: z.object({
        category_id: positiveInt.optional(),
        brand_id: positiveInt.optional(),
        search: z.string().trim().max(120).optional(),
        category: z.string().trim().min(1).max(120).optional(),
        q: z.string().trim().max(120).optional(),
        sort: z.enum(['popular', 'new', 'price_asc', 'price_desc']).optional(),
        page: z.coerce.number().int().min(1).max(200).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }).transform((data) => {
        const search = [data.search, data.q]
            .map(value => value?.trim())
            .find(value => !!value);

        return {
            category_id: data.category_id,
            brand_id: data.brand_id,
            category: data.category?.trim() || undefined,
            search: search || undefined,
            sort: data.sort,
            page: data.page || 1,
            limit: data.limit || 20,
        };
    }),
});

export const StoreProductByIdSchema = z.object({
    params: z.object({
        id: positiveInt,
    }),
});

