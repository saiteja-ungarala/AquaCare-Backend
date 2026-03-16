import { z } from 'zod';

// bcrypt silently truncates passwords longer than 72 bytes.
// Rejecting passwords > 72 chars prevents a subtle auth bypass where two
// different long passwords hash to the same bcrypt digest.
const passwordField = z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long');

export const SignupSchema = z.object({
    body: z.object({
        full_name: z.string().min(2).max(100),
        email: z.string().email(),
        password: passwordField,
        phone: z.string().regex(/^\d{10}$/).optional(),
        role: z.enum(['customer', 'agent', 'dealer']).default('customer'),
    }),
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1).max(72),
        role: z.enum(['customer', 'agent', 'dealer']),
    }),
});

export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1),
    }),
});

export const SendOtpSchema = z.object({
    body: z.object({
        phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    }),
});

export const VerifyOtpSchema = z.object({
    body: z.object({
        phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
        otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    }),
});

export const ResetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: passwordField,
    }),
});
