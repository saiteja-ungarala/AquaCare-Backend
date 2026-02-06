"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBookingSchema = void 0;
const zod_1 = require("zod");
exports.CreateBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        service_id: zod_1.z.number(),
        scheduled_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format YYYY-MM-DD'),
        scheduled_time: zod_1.z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format HH:MM:SS'),
        address_id: zod_1.z.number().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
