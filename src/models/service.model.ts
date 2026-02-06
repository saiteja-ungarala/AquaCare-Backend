import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface Service {
    id: number;
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
    duration_minutes?: number;
    base_price: number;
    is_active: boolean;
    created_at: Date;
}

export const ServiceModel = {
    async findAll(params: { category?: string; search?: string; limit?: number; offset?: number }): Promise<{ services: Service[]; total: number }> {
        let query = 'SELECT * FROM services WHERE is_active = 1';
        const values: any[] = [];

        if (params.category) {
            query += ' AND category = ?';
            values.push(params.category);
        }

        if (params.search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            values.push(`%${params.search}%`, `%${params.search}%`);
        }

        // Count query
        const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${query}) as t`, values);
        const total = countRows[0].total;

        // Pagination
        if (params.limit) {
            query += ' LIMIT ? OFFSET ?';
            values.push(params.limit, params.offset || 0);
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, values);
        return { services: rows as Service[], total };
    },

    async findById(id: number): Promise<Service | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM services WHERE id = ? AND is_active = 1', [id]);
        return (rows[0] as Service) || null;
    },
};
