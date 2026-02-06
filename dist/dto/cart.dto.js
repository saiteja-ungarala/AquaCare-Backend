"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCartItemSchema = exports.AddCartItemSchema = void 0;
const zod_1 = require("zod");
exports.AddCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        item_type: zod_1.z.enum(['product', 'service']),
        product_id: zod_1.z.number().optional(),
        service_id: zod_1.z.number().optional(),
        qty: zod_1.z.number().min(1).default(1),
        // Service specific
        booking_date: zod_1.z.string().optional(),
        booking_time: zod_1.z.string().optional(),
        address_id: zod_1.z.number().optional(),
        notes: zod_1.z.string().optional(),
    }).refine(data => data.product_id || data.service_id, {
        message: "At least one of product_id or service_id is required"
    }),
});
exports.UpdateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        qty: zod_1.z.number().min(1).optional(),
        booking_date: zod_1.z.string().optional(),
        booking_time: zod_1.z.string().optional(),
        address_id: zod_1.z.number().optional(),
        notes: zod_1.z.string().optional(),
    })
});
