"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCartItemSchema = exports.AddCartItemSchema = void 0;
const zod_1 = require("zod");
exports.AddCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Accept both camelCase and snake_case
        itemType: zod_1.z.enum(['product', 'service']).optional(),
        item_type: zod_1.z.enum(['product', 'service']).optional(),
        productId: zod_1.z.coerce.number().optional(),
        product_id: zod_1.z.coerce.number().optional(),
        serviceId: zod_1.z.coerce.number().optional(),
        service_id: zod_1.z.coerce.number().optional(),
        qty: zod_1.z.coerce.number().min(1).default(1),
        // Service specific
        bookingDate: zod_1.z.string().optional(),
        booking_date: zod_1.z.string().optional(),
        bookingTime: zod_1.z.string().optional(),
        booking_time: zod_1.z.string().optional(),
        addressId: zod_1.z.number().optional(),
        address_id: zod_1.z.number().optional(),
        notes: zod_1.z.string().optional(),
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
        if (data.item_type === 'product')
            return !!data.product_id;
        if (data.item_type === 'service')
            return !!data.service_id;
        return false;
    }, {
        message: "product_id is required for product items and service_id is required for service items"
    }),
});
exports.UpdateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        qty: zod_1.z.coerce.number().min(0).optional(),
        bookingDate: zod_1.z.string().optional(),
        booking_date: zod_1.z.string().optional(),
        bookingTime: zod_1.z.string().optional(),
        booking_time: zod_1.z.string().optional(),
        addressId: zod_1.z.coerce.number().optional(),
        address_id: zod_1.z.coerce.number().optional(),
        notes: zod_1.z.string().optional(),
    }).transform(data => ({
        qty: data.qty,
        booking_date: data.bookingDate || data.booking_date,
        booking_time: data.bookingTime || data.booking_time,
        address_id: data.addressId || data.address_id,
        notes: data.notes,
    }))
});
