import { z } from 'zod';
import { normalizeRoleValue } from '../utils/technician-domain';

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

const normalizeRoleInput = (value: unknown) => (typeof value === 'string' ? normalizeRoleValue(value) : value);

const roleField = z.preprocess(
    normalizeRoleInput,
    z.enum(['customer', 'technician', 'dealer'], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    })
);

const loginRoleField = z.preprocess(
    normalizeRoleInput,
    z.enum(['customer', 'technician', 'dealer', 'admin'], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    })
);

const otpChannelField = z.enum(['email', 'sms', 'whatsapp']);
const otpField = z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits');
const sessionTokenField = z.string().min(16, 'Session token is required');

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
        role: loginRoleField,
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
        otp: otpField,
    }),
});

export const SignupInitiateSchema = SignupSchema;

export const SignupVerifyOtpSchema = z.object({
    body: z.object({
        sessionToken: sessionTokenField,
        channel: z.enum(['email', 'sms']),
        otp: otpField,
    }),
});

export const SignupVerifyFirebaseSmsSchema = z.object({
    body: z.object({
        sessionToken: sessionTokenField,
        firebaseIdToken: z.string().min(1, 'Firebase ID token is required'),
    }),
});

export const SignupResendOtpSchema = z.object({
    body: z.object({
        sessionToken: sessionTokenField,
        channel: z.enum(['email', 'sms']),
    }),
});

export const LoginOtpStartSchema = z.object({
    body: z.object({
        phone: phoneField,
        role: roleField,
    }),
});

export const LoginOtpResendSchema = z.object({
    body: z.object({
        sessionToken: sessionTokenField,
        channel: otpChannelField,
    }),
});

export const LoginOtpVerifySchema = z.object({
    body: z.object({
        sessionToken: sessionTokenField,
        channel: otpChannelField,
        otp: otpField,
    }),
});

export const ResetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1),
        newPassword: signupPasswordField,
    }),
});
