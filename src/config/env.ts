import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || '';
const parsedConnectionUrl = connectionUrl ? new URL(connectionUrl) : null;

const getEnvValue = (...keys: string[]): string => {
    for (const key of keys) {
        const value = process.env[key];
        if (value) {
            return value;
        }
    }

    return '';
};

const getConnectionUrlValue = (field: 'hostname' | 'port' | 'username' | 'password' | 'pathname'): string => {
    if (!parsedConnectionUrl) {
        return '';
    }

    if (field === 'pathname') {
        return parsedConnectionUrl.pathname.replace(/^\/+/, '');
    }

    return parsedConnectionUrl[field] ?? '';
};

const getRequiredResolvedValue = (label: string, directValue: string, fallbackValue = ''): string => {
    const value = directValue || fallbackValue;
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
    DB_PORT: Number(getRequiredResolvedValue('DB_PORT', getEnvValue('DB_PORT', 'MYSQLPORT'), getConnectionUrlValue('port'))),
    DB_HOST: getRequiredResolvedValue('DB_HOST', getEnvValue('DB_HOST', 'MYSQLHOST'), getConnectionUrlValue('hostname')),
    DB_USER: getRequiredResolvedValue('DB_USER', getEnvValue('DB_USER', 'MYSQLUSER'), decodeURIComponent(getConnectionUrlValue('username'))),
    DB_PASSWORD: getRequiredResolvedValue('DB_PASSWORD', getEnvValue('DB_PASSWORD', 'MYSQLPASSWORD'), decodeURIComponent(getConnectionUrlValue('password'))),
    DB_NAME: getRequiredResolvedValue('DB_NAME', getEnvValue('DB_NAME', 'MYSQLDATABASE'), decodeURIComponent(getConnectionUrlValue('pathname'))),
    JWT_SECRET: getRequiredResolvedValue('JWT_SECRET', getEnvValue('JWT_SECRET')),
    JWT_REFRESH_SECRET: getRequiredResolvedValue('JWT_REFRESH_SECRET', getEnvValue('JWT_REFRESH_SECRET')),
    JWT_ACCESS_EXPIRY: getRequiredResolvedValue('JWT_ACCESS_EXPIRY', getEnvValue('JWT_ACCESS_EXPIRY')),
    JWT_REFRESH_EXPIRY: getRequiredResolvedValue('JWT_REFRESH_EXPIRY', getEnvValue('JWT_REFRESH_EXPIRY')),
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    // ── Third-party keys (optional until configured in hosting platform) ─────
    RAZORPAY_KEY_ID: getOptionalEnv('RAZORPAY_KEY_ID'),
    RAZORPAY_KEY_SECRET: getOptionalEnv('RAZORPAY_KEY_SECRET'),
    RAZORPAY_WEBHOOK_SECRET: getOptionalEnv('RAZORPAY_WEBHOOK_SECRET'),
    FAST2SMS_API_KEY: getOptionalEnv('FAST2SMS_API_KEY'),
    SENDGRID_API_KEY: getOptionalEnv('SENDGRID_API_KEY'),
    BREVO_API_KEY: getOptionalEnv('BREVO_API_KEY'),
    BREVO_FROM_EMAIL: getOptionalEnv('BREVO_FROM_EMAIL'),
    BREVO_FROM_NAME: getOptionalEnv('BREVO_FROM_NAME'),
    FROM_EMAIL: getOptionalEnv('FROM_EMAIL'),
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
};
