import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon_key?: string;
    is_active: boolean;
    sort_order: number;
}

export interface StoreProduct {
    id: number;
    name: string;
    description?: string;
    price: number;
    mrp?: number;
    stockQty: number;
    imageUrl?: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
}

interface ProductQueryParams {
    category?: string;
    q?: string;
    sort?: 'popular' | 'new' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
}

export const StoreService = {
    async getCategories(): Promise<any[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, slug, icon_key 
             FROM product_categories 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, name ASC`
        );

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            iconKey: row.icon_key || null,
        }));
    },

    async getProducts(params: ProductQueryParams): Promise<{ items: any[]; page: number; limit: number; total: number }> {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE p.is_active = 1';
        const values: any[] = [];

        // Filter by category slug
        if (params.category) {
            whereClause += ' AND pc.slug = ?';
            values.push(params.category);
        }

        // Search by name or description
        if (params.q) {
            whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            values.push(`%${params.q}%`, `%${params.q}%`);
        }

        // Sorting
        let orderBy = 'ORDER BY p.created_at DESC'; // default: new
        switch (params.sort) {
            case 'popular':
                orderBy = 'ORDER BY p.created_at DESC'; // For now, same as new
                break;
            case 'new':
                orderBy = 'ORDER BY p.created_at DESC';
                break;
            case 'price_asc':
                orderBy = 'ORDER BY p.price ASC';
                break;
            case 'price_desc':
                orderBy = 'ORDER BY p.price DESC';
                break;
        }

        // Count query
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            ${whereClause}
        `;
        const [countRows] = await pool.query<RowDataPacket[]>(countQuery, values);
        const total = countRows[0].total;

        // Data query
        const dataQuery = `
            SELECT 
                p.id, p.name, p.description, p.price, p.mrp, 
                p.stock_qty, p.image_url, p.created_at,
                pc.id as category_id, pc.name as category_name, pc.slug as category_slug
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            ${whereClause}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...values, limit, offset]);

        const items = rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description || null,
            price: Number(row.price),
            mrp: row.mrp ? Number(row.mrp) : null,
            stockQty: row.stock_qty,
            imageUrl: row.image_url || null,
            category: row.category_id ? {
                id: row.category_id,
                name: row.category_name,
                slug: row.category_slug,
            } : null,
        }));

        return { items, page, limit, total };
    },

    async getProductById(id: number): Promise<any | null> {
        const query = `
            SELECT 
                p.id, p.name, p.description, p.price, p.mrp, 
                p.stock_qty, p.image_url, p.sku, p.created_at,
                pc.id as category_id, pc.name as category_name, pc.slug as category_slug
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.id = ? AND p.is_active = 1
        `;
        const [rows] = await pool.query<RowDataPacket[]>(query, [id]);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            name: row.name,
            description: row.description || null,
            price: Number(row.price),
            mrp: row.mrp ? Number(row.mrp) : null,
            stockQty: row.stock_qty,
            imageUrl: row.image_url || null,
            sku: row.sku || null,
            category: row.category_id ? {
                id: row.category_id,
                name: row.category_name,
                slug: row.category_slug,
            } : null,
            createdAt: row.created_at,
        };
    },
};
