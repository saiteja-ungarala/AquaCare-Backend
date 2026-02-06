import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface Product {
    id: number;
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
    price: number;
    mrp?: number;
    stock_qty: number;
    sku?: string;
    is_active: boolean;
    created_at: Date;
}

export const ProductModel = {
    async findAll(params: { category?: string; search?: string; limit?: number; offset?: number }): Promise<{ products: Product[]; total: number }> {
        let query = 'SELECT * FROM products WHERE is_active = 1';
        const values: any[] = [];

        if (params.category) {
            query += ' AND category = ?';
            values.push(params.category);
        }

        if (params.search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            values.push(`%${params.search}%`, `%${params.search}%`);
        }

        const [countRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM (${query}) as t`, values);
        const total = countRows[0].total;

        if (params.limit) {
            query += ' LIMIT ? OFFSET ?';
            values.push(params.limit, params.offset || 0);
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, values);
        return { products: rows as Product[], total };
    },

    async findById(id: number): Promise<Product | null> {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
        return (rows[0] as Product) || null;
    },
};
