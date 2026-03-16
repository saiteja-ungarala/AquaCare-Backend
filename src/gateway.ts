import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';
import routes from './routers';
import { errorHandler } from './middlewares/error.middleware';

const app = express();
app.set('trust proxy', 1);
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);

// ── Rate-limiter factory ────────────────────────────────────────────────────
const createPostRateLimiter = (windowMs: number, max: number, message: string) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST',
    message: { error: message },
});

const createRateLimiter = (windowMs: number, max: number, message: string) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
});

// Auth — existing
const authLoginLimiter   = createPostRateLimiter(15 * 60 * 1000, 5,  'Too many login attempts. Please try again later.');
const authSignupLimiter  = createPostRateLimiter(60 * 60 * 1000, 10, 'Too many signup attempts. Please try again later.');
const authSendOtpLimiter = createPostRateLimiter(60 * 60 * 1000, 3,  'Too many OTP requests. Please try again later.');
const kycUploadLimiter   = createPostRateLimiter(60 * 60 * 1000, 10, 'Too many KYC upload attempts. Please try again later.');

// Auth — new hardening
const authRefreshLimiter       = createRateLimiter(15 * 60 * 1000, 20, 'Too many token refresh requests. Please try again later.');
const authForgotPasswordLimiter = createRateLimiter(60 * 60 * 1000, 5,  'Too many password reset requests. Please try again later.');
const authResetPasswordLimiter  = createRateLimiter(60 * 60 * 1000, 10, 'Too many password reset attempts. Please try again later.');

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ────────────────────────────────────────────────────────────────────
// Note: !origin is intentional — native mobile clients do not send an Origin header.
app.use(cors({
    origin: (origin, cb) => (!origin || ALLOWED.includes(origin)) ? cb(null, true) : cb(new Error('CORS')),
    credentials: true,
}));

// ── Body parsers with strict size limits ───────────────────────────────────
// 50 KB is generous for all API payloads; prevents memory-exhaustion via large bodies.
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Static files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Rate limiters ───────────────────────────────────────────────────────────
// Auth — existing
app.use('/api/auth/login',    authLoginLimiter);
app.use('/api/auth/signup',   authSignupLimiter);
app.use('/api/auth/send-otp', authSendOtpLimiter);
app.use('/api/agent/kyc',     kycUploadLimiter);
app.use('/api/dealer/kyc',    kycUploadLimiter);

// Auth — new hardening
app.use('/api/auth/refresh',          authRefreshLimiter);
app.use('/api/auth/forgot-password',  authForgotPasswordLimiter);
app.use('/api/auth/reset-password',   authResetPasswordLimiter);

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
