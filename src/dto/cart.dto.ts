import { z } from 'zod';

export const AddCartItemSchema = z.object({
    body: z.object({
        // Accept both camelCase and snake_case
        itemType: z.enum(['product', 'service']).optional(),
        item_type: z.enum(['product', 'service']).optional(),
        productId: z.coerce.number().optional(),
        product_id: z.coerce.number().optional(),
        serviceId: z.coerce.number().optional(),
        service_id: z.coerce.number().optional(),
        qty: z.coerce.number().min(1).default(1),
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
    }).refine(data => {
        if (data.item_type === 'product') return !!data.product_id;
        if (data.item_type === 'service') return !!data.service_id;
        return false;
    }, {
        message: "product_id is required for product items and service_id is required for service items"
    }),
});

export const UpdateCartItemSchema = z.object({
    body: z.object({
        qty: z.coerce.number().min(0).optional(),
        bookingDate: z.string().optional(),
        booking_date: z.string().optional(),
        bookingTime: z.string().optional(),
        booking_time: z.string().optional(),
        addressId: z.coerce.number().optional(),
        address_id: z.coerce.number().optional(),
        notes: z.string().optional(),
    }).transform(data => ({
        qty: data.qty,
        booking_date: data.bookingDate || data.booking_date,
        booking_time: data.bookingTime || data.booking_time,
        address_id: data.addressId || data.address_id,
        notes: data.notes,
    }))
});
