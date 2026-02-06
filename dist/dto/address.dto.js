"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressSchema = void 0;
const zod_1 = require("zod");
exports.AddressSchema = zod_1.z.object({
    body: zod_1.z.object({
        label: zod_1.z.string().optional(),
        line1: zod_1.z.string().min(5),
        line2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(2),
        state: zod_1.z.string().min(2),
        postal_code: zod_1.z.string().min(4),
        country: zod_1.z.string().default('India'),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        is_default: zod_1.z.boolean().default(false),
    }),
});
