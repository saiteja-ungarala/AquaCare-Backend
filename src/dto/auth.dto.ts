import { z } from 'zod';

export const SignupSchema = z.object({
    body: z.object({
        full_name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        role: z.enum(['customer', 'agent', 'dealer']).default('customer'),
    }),
});

export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});
