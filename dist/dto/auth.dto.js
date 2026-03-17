"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordSchema = exports.VerifyOtpSchema = exports.SendOtpSchema = exports.RefreshSchema = exports.LoginSchema = exports.SignupSchema = void 0;
const zod_1 = require("zod");
// bcrypt silently truncates passwords longer than 72 bytes.
// Rejecting passwords > 72 chars prevents a subtle auth bypass where two
// different long passwords hash to the same bcrypt digest.
const passwordField = zod_1.z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long');
exports.SignupSchema = zod_1.z.object({
    body: zod_1.z.object({
        full_name: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        password: passwordField,
        phone: zod_1.z.string().regex(/^\d{10}$/).optional(),
        role: zod_1.z.enum(['customer', 'agent', 'dealer']).default('customer'),
    }),
});
exports.LoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1).max(72),
        role: zod_1.z.enum(['customer', 'agent', 'dealer']),
    }),
});
exports.RefreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1),
    }),
});
exports.SendOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    }),
});
exports.VerifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
        otp: zod_1.z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    }),
});
exports.ResetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1),
        newPassword: passwordField,
    }),
});
