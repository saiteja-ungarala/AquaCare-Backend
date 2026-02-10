import { z } from 'zod';

export const AddCartItemSchema = z.object({
    body: z.object({
        // Accept both camelCase and snake_case
        itemType: z.enum(['product', 'service']).optional(),
        item_type: z.enum(['product', 'service']).optional(),
        productId: z.number().optional(),
        product_id: z.number().optional(),
        serviceId: z.number().optional(),
        service_id: z.number().optional(),
        qty: z.number().min(1).default(1),
        // Service specific
        bookingDate: z.string().optional(),
        booking_date: z.string().optional(),
        bookingTime: z.string().optional(),
        booking_time: z.string().optional(),
        addressId: z.number().optional(),
        address_id: z.number().optional(),
        notes: z.string().optional(),
    }).transform(data => ({
        item_type: data.itemType || data.item_type,
        product_id: data.productId || data.product_id,
        service_id: data.serviceId || data.service_id,
        qty: data.qty,
        booking_date: data.bookingDate || data.booking_date,
        booking_time: data.bookingTime || data.booking_time,
        address_id: data.addressId || data.address_id,
        notes: data.notes,
    })).refine(data => data.item_type, {
        message: "item_type is required (product or service)"
    }).refine(data => data.product_id || data.service_id, {
        message: "At least one of productId or serviceId is required"
    }),
});

export const UpdateCartItemSchema = z.object({
    body: z.object({
        qty: z.number().min(1).optional(),
        bookingDate: z.string().optional(),
        booking_date: z.string().optional(),
        bookingTime: z.string().optional(),
        booking_time: z.string().optional(),
        addressId: z.number().optional(),
        address_id: z.number().optional(),
        notes: z.string().optional(),
    }).transform(data => ({
        qty: data.qty,
        booking_date: data.bookingDate || data.booking_date,
        booking_time: data.bookingTime || data.booking_time,
        address_id: data.addressId || data.address_id,
        notes: data.notes,
    }))
});
