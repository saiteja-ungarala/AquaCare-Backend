import { z } from 'zod';

export const AddCartItemSchema = z.object({
    body: z.object({
        item_type: z.enum(['product', 'service']),
        product_id: z.number().optional(),
        service_id: z.number().optional(),
        qty: z.number().min(1).default(1),
        // Service specific
        booking_date: z.string().optional(),
        booking_time: z.string().optional(),
        address_id: z.number().optional(),
        notes: z.string().optional(),
    }).refine(data => data.product_id || data.service_id, {
        message: "At least one of product_id or service_id is required"
    }),
});

export const UpdateCartItemSchema = z.object({
    body: z.object({
        qty: z.number().min(1).optional(),
        booking_date: z.string().optional(),
        booking_time: z.string().optional(),
        address_id: z.number().optional(),
        notes: z.string().optional(),
    })
});
