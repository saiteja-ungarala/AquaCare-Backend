"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutSchema = void 0;
const zod_1 = require("zod");
exports.CheckoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        addressId: zod_1.z.coerce.number().optional(),
        address_id: zod_1.z.coerce.number().optional(),
        paymentMethod: zod_1.z.enum(['cod', 'wallet', 'online']).optional(),
        payment_method: zod_1.z.enum(['cod', 'wallet', 'online']).optional(),
        referralCode: zod_1.z.preprocess((value) => (typeof value === 'string' ? value : undefined), zod_1.z.string().optional()),
        referral_code: zod_1.z.preprocess((value) => (typeof value === 'string' ? value : undefined), zod_1.z.string().optional()),
    }).transform(data => ({
        address_id: data.addressId || data.address_id,
        payment_method: data.paymentMethod || data.payment_method || 'cod',
        referral_code: data.referralCode || data.referral_code,
    })),
});
