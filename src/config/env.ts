import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getEnvValue = (...keys: string[]): string => {
    for (const key of keys) {
        const value = process.env[key];
        if (value) {
            return value;
        }
    }

    return '';
};

const getRequiredEnv = (label: string, ...keys: string[]): string => {
    const value = getEnvValue(...keys);
    if (!value) {
        throw new Error(`Required env var missing: ${label}`);
    }
    return value;
};

// Returns the env var value, or an empty string if not set.
// Used for third-party API keys that are temporarily disabled.
const getOptionalEnv = (key: string): string => {
    return process.env[key] ?? '';
};

export const env = {
    port: Number(getEnvValue('PORT') || '5000'),
    BASE_SERVER_URL: process.env.BASE_SERVER_URL ?? '',
    DB_PORT: Number(getRequiredEnv('DB_PORT', 'DB_PORT', 'MYSQLPORT')),
    DB_HOST: getRequiredEnv('DB_HOST', 'DB_HOST', 'MYSQLHOST'),
    DB_USER: getRequiredEnv('DB_USER', 'DB_USER', 'MYSQLUSER'),
    DB_PASSWORD: getRequiredEnv('DB_PASSWORD', 'DB_PASSWORD', 'MYSQLPASSWORD'),
    DB_NAME: getRequiredEnv('DB_NAME', 'DB_NAME', 'MYSQLDATABASE'),
    JWT_SECRET: getRequiredEnv('JWT_SECRET', 'JWT_SECRET'),
    JWT_REFRESH_SECRET: getRequiredEnv('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET'),
    JWT_ACCESS_EXPIRY: getRequiredEnv('JWT_ACCESS_EXPIRY', 'JWT_ACCESS_EXPIRY'),
    JWT_REFRESH_EXPIRY: getRequiredEnv('JWT_REFRESH_EXPIRY', 'JWT_REFRESH_EXPIRY'),
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    // ── Third-party keys (optional until configured in hosting platform) ─────
    RAZORPAY_KEY_ID: getOptionalEnv('RAZORPAY_KEY_ID'),
    RAZORPAY_KEY_SECRET: getOptionalEnv('RAZORPAY_KEY_SECRET'),
    RAZORPAY_WEBHOOK_SECRET: getOptionalEnv('RAZORPAY_WEBHOOK_SECRET'),
    FAST2SMS_API_KEY: getOptionalEnv('FAST2SMS_API_KEY'),
    SENDGRID_API_KEY: getOptionalEnv('SENDGRID_API_KEY'),
    FROM_EMAIL: getOptionalEnv('FROM_EMAIL'),
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
};
