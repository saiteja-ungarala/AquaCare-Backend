"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCartItemSchema = exports.AddCartItemSchema = void 0;
const zod_1 = require("zod");
exports.AddCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        // Accept both camelCase and snake_case
        itemType: zod_1.z.enum(['product', 'service']).optional(),
        item_type: zod_1.z.enum(['product', 'service']).optional(),
        productId: zod_1.z.number().optional(),
        product_id: zod_1.z.number().optional(),
        serviceId: zod_1.z.number().optional(),
        service_id: zod_1.z.number().optional(),
        qty: zod_1.z.number().min(1).default(1),
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
    }).refine(data => data.product_id || data.service_id, {
        message: "At least one of productId or serviceId is required"
    }),
});
exports.UpdateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        qty: zod_1.z.number().min(1).optional(),
        bookingDate: zod_1.z.string().optional(),
        booking_date: zod_1.z.string().optional(),
        bookingTime: zod_1.z.string().optional(),
        booking_time: zod_1.z.string().optional(),
        addressId: zod_1.z.number().optional(),
        address_id: zod_1.z.number().optional(),
        notes: zod_1.z.string().optional(),
    }).transform(data => ({
        qty: data.qty,
        booking_date: data.bookingDate || data.booking_date,
        booking_time: data.bookingTime || data.booking_time,
        address_id: data.addressId || data.address_id,
        notes: data.notes,
    }))
});
