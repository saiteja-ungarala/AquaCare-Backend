import { z } from 'zod';

// bcrypt silently truncates passwords longer than 72 bytes.
// Rejecting passwords > 72 chars prevents a subtle auth bypass where two
// different long passwords hash to the same bcrypt digest.
const signupPasswordField = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or fewer');

const loginPasswordField = z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password must be 72 characters or fewer');

const emailField = z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address');

const phoneField = z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');

const fullNameField = z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be 100 characters or fewer');

const roleField = z.enum(['customer', 'agent', 'dealer'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
});

export const SignupSchema = z.object({
    body: z.object({
        full_name: fullNameField,
        email: emailField,
        password: signupPasswordField,
        phone: phoneField.optional(),
        role: roleField.default('customer'),
    }),
});

export const LoginSchema = z.object({
    body: z.object({
        email: emailField,
        password: loginPasswordField,
        role: roleField,
    }),
});

export const ForgotPasswordSchema = z.object({
    body: z.object({
        email: emailField,
    }),
});

export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1),
    }),
});

export const SendOtpSchema = z.object({
    body: z.object({
        phone: phoneField,
    }),
});

export const VerifyOtpSchema = z.object({
    body: z.object({
        phone: phoneField,
        otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
    }),
});

export const ResetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: signupPasswordField,
    }),
});
