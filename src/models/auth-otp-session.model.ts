import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db';

export type AuthOtpPurpose = 'signup' | 'login';
export type AuthOtpChannel = 'email' | 'sms' | 'whatsapp';

export interface AuthOtpSession {
    id: number;
    session_token: string;
    purpose: AuthOtpPurpose;
    role: string | null;
    user_id: number | null;
    created_user_id: number | null;
    full_name: string | null;
    email: string;
    phone: string;
    password_hash: string | null;
    email_otp_hash: string | null;
    email_otp_expires_at: Date | null;
    email_otp_attempts: number;
    email_verified: boolean;
    sms_otp_hash: string | null;
    sms_otp_expires_at: Date | null;
    sms_otp_attempts: number;
    sms_verified: boolean;
    whatsapp_otp_hash: string | null;
    whatsapp_otp_expires_at: Date | null;
    whatsapp_otp_attempts: number;
    whatsapp_verified: boolean;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}

type CreateAuthOtpSessionInput = Omit<AuthOtpSession, 'id' | 'created_at' | 'updated_at'>;

const CHANNEL_COLUMN_MAP: Record<AuthOtpChannel, {
    hash: keyof AuthOtpSession;
    expiresAt: keyof AuthOtpSession;
    attempts: keyof AuthOtpSession;
    verified: keyof AuthOtpSession;
}> = {
    email: {
        hash: 'email_otp_hash',
        expiresAt: 'email_otp_expires_at',
        attempts: 'email_otp_attempts',
        verified: 'email_verified',
    },
    sms: {
        hash: 'sms_otp_hash',
        expiresAt: 'sms_otp_expires_at',
        attempts: 'sms_otp_attempts',
        verified: 'sms_verified',
    },
    whatsapp: {
        hash: 'whatsapp_otp_hash',
        expiresAt: 'whatsapp_otp_expires_at',
        attempts: 'whatsapp_otp_attempts',
        verified: 'whatsapp_verified',
    },
};

let tableEnsured = false;

const ensureTable = async (): Promise<void> => {
    if (tableEnsured) {
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_otp_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_token VARCHAR(64) NOT NULL UNIQUE,
            purpose VARCHAR(20) NOT NULL,
            role VARCHAR(20) NULL,
            user_id INT NULL,
            created_user_id INT NULL,
            full_name VARCHAR(100) NULL,
            email VARCHAR(191) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            password_hash VARCHAR(255) NULL,
            email_otp_hash VARCHAR(255) NULL,
            email_otp_expires_at DATETIME NULL,
            email_otp_attempts INT NOT NULL DEFAULT 0,
            email_verified TINYINT(1) NOT NULL DEFAULT 0,
            sms_otp_hash VARCHAR(255) NULL,
            sms_otp_expires_at DATETIME NULL,
            sms_otp_attempts INT NOT NULL DEFAULT 0,
            sms_verified TINYINT(1) NOT NULL DEFAULT 0,
            whatsapp_otp_hash VARCHAR(255) NULL,
            whatsapp_otp_expires_at DATETIME NULL,
            whatsapp_otp_attempts INT NOT NULL DEFAULT 0,
            whatsapp_verified TINYINT(1) NOT NULL DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_auth_otp_sessions_purpose_phone (purpose, phone),
            INDEX idx_auth_otp_sessions_purpose_email (purpose, email),
            INDEX idx_auth_otp_sessions_purpose_user (purpose, user_id)
        )
    `);

    tableEnsured = true;
};

const mapRow = (row: RowDataPacket): AuthOtpSession => ({
    id: Number(row.id),
    session_token: String(row.session_token),
    purpose: String(row.purpose) as AuthOtpPurpose,
    role: row.role ? String(row.role) : null,
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    created_user_id: row.created_user_id === null || row.created_user_id === undefined ? null : Number(row.created_user_id),
    full_name: row.full_name ? String(row.full_name) : null,
    email: String(row.email),
    phone: String(row.phone),
    password_hash: row.password_hash ? String(row.password_hash) : null,
    email_otp_hash: row.email_otp_hash ? String(row.email_otp_hash) : null,
    email_otp_expires_at: row.email_otp_expires_at ? (row.email_otp_expires_at as Date) : null,
    email_otp_attempts: Number(row.email_otp_attempts || 0),
    email_verified: Boolean(row.email_verified),
    sms_otp_hash: row.sms_otp_hash ? String(row.sms_otp_hash) : null,
    sms_otp_expires_at: row.sms_otp_expires_at ? (row.sms_otp_expires_at as Date) : null,
    sms_otp_attempts: Number(row.sms_otp_attempts || 0),
    sms_verified: Boolean(row.sms_verified),
    whatsapp_otp_hash: row.whatsapp_otp_hash ? String(row.whatsapp_otp_hash) : null,
    whatsapp_otp_expires_at: row.whatsapp_otp_expires_at ? (row.whatsapp_otp_expires_at as Date) : null,
    whatsapp_otp_attempts: Number(row.whatsapp_otp_attempts || 0),
    whatsapp_verified: Boolean(row.whatsapp_verified),
    expires_at: row.expires_at as Date,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
});

const buildUpdate = (data: Record<string, unknown>) => {
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
        return null;
    }

    return {
        fields: entries.map(([key]) => `${key} = ?`).join(', '),
        values: entries.map(([, value]) => value),
    };
};

export const AuthOtpSessionModel = {
    async create(data: CreateAuthOtpSessionInput): Promise<number> {
        await ensureTable();

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO auth_otp_sessions (
                session_token, purpose, role, user_id, created_user_id, full_name, email, phone, password_hash,
                email_otp_hash, email_otp_expires_at, email_otp_attempts, email_verified,
                sms_otp_hash, sms_otp_expires_at, sms_otp_attempts, sms_verified,
                whatsapp_otp_hash, whatsapp_otp_expires_at, whatsapp_otp_attempts, whatsapp_verified,
                expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.session_token,
                data.purpose,
                data.role,
                data.user_id,
                data.created_user_id,
                data.full_name,
                data.email,
                data.phone,
                data.password_hash,
                data.email_otp_hash,
                data.email_otp_expires_at,
                data.email_otp_attempts,
                data.email_verified ? 1 : 0,
                data.sms_otp_hash,
                data.sms_otp_expires_at,
                data.sms_otp_attempts,
                data.sms_verified ? 1 : 0,
                data.whatsapp_otp_hash,
                data.whatsapp_otp_expires_at,
                data.whatsapp_otp_attempts,
                data.whatsapp_verified ? 1 : 0,
                data.expires_at,
            ]
        );

        return result.insertId;
    },

    async findBySessionToken(sessionToken: string): Promise<AuthOtpSession | null> {
        await ensureTable();

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM auth_otp_sessions WHERE session_token = ? LIMIT 1',
            [sessionToken]
        );

        return rows[0] ? mapRow(rows[0]) : null;
    },

    async updateBySessionToken(sessionToken: string, data: Partial<AuthOtpSession>): Promise<void> {
        await ensureTable();
        const update = buildUpdate(data as Record<string, unknown>);
        if (!update) {
            return;
        }

        await pool.query(
            `UPDATE auth_otp_sessions SET ${update.fields} WHERE session_token = ?`,
            [...update.values, sessionToken]
        );
    },

    async setChannelOtp(sessionToken: string, channel: AuthOtpChannel, otpHash: string, expiresAt: Date): Promise<void> {
        await ensureTable();
        const columns = CHANNEL_COLUMN_MAP[channel];

        await pool.query(
            `UPDATE auth_otp_sessions
             SET ${String(columns.hash)} = ?, ${String(columns.expiresAt)} = ?, ${String(columns.attempts)} = 0, ${String(columns.verified)} = 0
             WHERE session_token = ?`,
            [otpHash, expiresAt, sessionToken]
        );
    },

    async incrementAttempts(sessionToken: string, channel: AuthOtpChannel): Promise<void> {
        await ensureTable();
        const columns = CHANNEL_COLUMN_MAP[channel];
        await pool.query(
            `UPDATE auth_otp_sessions SET ${String(columns.attempts)} = ${String(columns.attempts)} + 1 WHERE session_token = ?`,
            [sessionToken]
        );
    },

    async markChannelVerified(sessionToken: string, channel: AuthOtpChannel): Promise<void> {
        await ensureTable();
        const columns = CHANNEL_COLUMN_MAP[channel];
        await pool.query(
            `UPDATE auth_otp_sessions SET ${String(columns.verified)} = 1 WHERE session_token = ?`,
            [sessionToken]
        );
    },

    async setCreatedUser(sessionToken: string, userId: number): Promise<void> {
        await ensureTable();
        await pool.query(
            'UPDATE auth_otp_sessions SET created_user_id = ? WHERE session_token = ?',
            [userId, sessionToken]
        );
    },

    async deleteExpired(): Promise<void> {
        await ensureTable();
        await pool.query('DELETE FROM auth_otp_sessions WHERE expires_at < NOW()');
    },

    async deleteBySessionToken(sessionToken: string): Promise<void> {
        await ensureTable();
        await pool.query('DELETE FROM auth_otp_sessions WHERE session_token = ?', [sessionToken]);
    },

    async deleteByPurposeAndIdentity(
        purpose: AuthOtpPurpose,
        identity: { email?: string; phone?: string; userId?: number }
    ): Promise<void> {
        await ensureTable();

        const conditions: string[] = ['purpose = ?'];
        const values: Array<string | number> = [purpose];

        if (identity.email) {
            conditions.push('email = ?');
            values.push(identity.email);
        }

        if (identity.phone) {
            conditions.push('phone = ?');
            values.push(identity.phone);
        }

        if (identity.userId !== undefined) {
            conditions.push('user_id = ?');
            values.push(identity.userId);
        }

        await pool.query(
            `DELETE FROM auth_otp_sessions WHERE ${conditions.join(' AND ')}`,
            values
        );
    },
};
