"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutSchema = void 0;
const zod_1 = require("zod");
exports.CheckoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        address_id: zod_1.z.number(),
        payment_method: zod_1.z.enum(['cod', 'wallet', 'online']).default('cod'),
    }),
});
