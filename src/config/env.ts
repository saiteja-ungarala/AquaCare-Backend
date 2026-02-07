import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
    port: process.env.PORT || 3000,
    DB_PORT: Number(process.env.DB_PORT || 3306),
    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || 'ROOT',
    DB_NAME: process.env.DB_NAME || 'aquacare',
    JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    NODE_ENV: process.env.NODE_ENV || 'development',
};
