import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export interface Address {
    id: number;
    user_id: number;
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
}

export const AddressModel = {
    async findAll(userId: number): Promise<Address[]> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [userId]);
        return rows as Address[];
    },

    async findById(id: number): Promise<Address | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM addresses WHERE id = ?', [id]);
        return (rows[0] as Address) || null;
    },

    async create(address: Partial<Address>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO addresses (user_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                address.user_id, address.label || null, address.line1, address.line2 || null,
                address.city, address.state, address.postal_code, address.country || 'India',
                address.latitude || null, address.longitude || null, address.is_default ? 1 : 0
            ]
        );
        return result.insertId;
    },

    async update(id: number, data: Partial<Address>): Promise<void> {
        if (Object.keys(data).length === 0) {
            return;
        }
        const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(data);
        await pool.query(`UPDATE addresses SET ${fields} WHERE id = ?`, [...values, id]);
    },

    async delete(id: number): Promise<void> {
        await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
    },

    async setDefault(userId: number, addressId: number): Promise<void> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
            await connection.query('UPDATE addresses SET is_default = 1 WHERE id = ? and user_id = ?', [addressId, userId]);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
};
