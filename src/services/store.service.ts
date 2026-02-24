import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface ProductQueryParams {
    category_id?: number;
    brand_id?: number;
    category?: string; // legacy slug filter
    search?: string;
    sort?: 'popular' | 'new' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value) || value.startsWith('data:');

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const ensureLeadingSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

const buildProductImageUrl = (imageUrl: string | null | undefined, baseServerUrl: string): string | null => {
    const rawValue = String(imageUrl || '').trim();
    if (!rawValue) return null;
    if (isAbsoluteUrl(rawValue)) return rawValue;

    const cleanBase = trimTrailingSlash(String(baseServerUrl || '').trim());
    const cleanPath = rawValue.split('?')[0].split('#')[0].trim();
    let relativePath = '';

    if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
        relativePath = ensureLeadingSlash(cleanPath);
    } else if (cleanPath.startsWith('/')) {
        relativePath = cleanPath;
    } else {
        relativePath = `/uploads/products/${cleanPath}`;
    }

    return cleanBase ? `${cleanBase}${relativePath}` : relativePath;
};

export const StoreService = {
    async getCategories(): Promise<any[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name, slug, icon_key, sort_order
             FROM product_categories 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, name ASC`
        );

        return rows.map(row => ({
            id: Number(row.id),
            name: row.name,
            slug: row.slug,
            icon_key: row.icon_key || null,
            sort_order: Number(row.sort_order || 0),
            // Backward-compatible aliases used by existing frontend.
            iconKey: row.icon_key || null,
            sortOrder: Number(row.sort_order || 0),
        }));
    },

    async getBrandsByCategory(categoryId: number): Promise<any[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT DISTINCT
                b.id,
                b.name,
                b.slug,
                b.logo_url,
                b.is_active,
                b.created_at,
                b.updated_at
            FROM brands b
            JOIN products p ON p.brand_id = b.id
            JOIN product_categories pc ON pc.id = p.category_id
            WHERE p.category_id = ?
              AND p.is_active = 1
              AND b.is_active = 1
              AND pc.is_active = 1
            ORDER BY b.name ASC`,
            [categoryId]
        );

        return rows.map(row => ({
            id: Number(row.id),
            name: row.name,
            slug: row.slug,
            logo_url: row.logo_url || null,
            is_active: Number(row.is_active) === 1,
            created_at: row.created_at,
            updated_at: row.updated_at,
            // Backward-compatible aliases used by existing frontend.
            logoUrl: row.logo_url || null,
            isActive: Number(row.is_active) === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },

    async getProducts(params: ProductQueryParams, baseServerUrl: string): Promise<{ items: any[]; page: number; limit: number; total: number }> {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE p.is_active = 1 AND pc.is_active = 1 AND b.is_active = 1';
        const values: any[] = [];

        if (params.category_id) {
            whereClause += ' AND p.category_id = ?';
            values.push(params.category_id);
        } else if (params.category) {
            whereClause += ' AND pc.slug = ?';
            values.push(params.category);
        }

        if (params.brand_id) {
            whereClause += ' AND p.brand_id = ?';
            values.push(params.brand_id);
        }

        if (params.search) {
            whereClause += ' AND (p.name LIKE ? OR COALESCE(p.description, "") LIKE ? OR b.name LIKE ?)';
            values.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
        }

        let orderBy = 'ORDER BY p.created_at DESC';
        switch (params.sort) {
            case 'popular':
                orderBy = 'ORDER BY p.created_at DESC';
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

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            JOIN brands b ON p.brand_id = b.id
            ${whereClause}
        `;
        const [countRows] = await pool.query<RowDataPacket[]>(countQuery, values);
        const total = Number(countRows[0]?.total || 0);

        const dataQuery = `
            SELECT 
                p.id, p.name, p.description, p.price, p.mrp, 
                p.stock_qty, p.image_url, p.sku, p.created_at,
                pc.id as category_id, pc.name as category_name, pc.slug as category_slug, pc.icon_key as category_icon_key, pc.sort_order as category_sort_order,
                b.id as brand_id, b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo_url
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            JOIN brands b ON p.brand_id = b.id
            ${whereClause}
            ${orderBy}
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...values, limit, offset]);

        const items = rows.map(row => ({
            id: Number(row.id),
            name: row.name,
            description: row.description || null,
            price: Number(row.price),
            mrp: row.mrp ? Number(row.mrp) : null,
            stock_qty: Number(row.stock_qty || 0),
            image_url: row.image_url || null,
            image_url_full: buildProductImageUrl(row.image_url || null, baseServerUrl),
            sku: row.sku || null,
            category: {
                id: Number(row.category_id),
                name: row.category_name,
                slug: row.category_slug,
                icon_key: row.category_icon_key || null,
                sort_order: Number(row.category_sort_order || 0),
                iconKey: row.category_icon_key || null,
                sortOrder: Number(row.category_sort_order || 0),
            },
            brand: {
                id: Number(row.brand_id),
                name: row.brand_name,
                slug: row.brand_slug,
                logo_url: row.brand_logo_url || null,
                logoUrl: row.brand_logo_url || null,
            },
            created_at: row.created_at,
            // Backward-compatible aliases used by existing frontend.
            stockQty: Number(row.stock_qty || 0),
            imageUrl: buildProductImageUrl(row.image_url || null, baseServerUrl),
            imageUrlFull: buildProductImageUrl(row.image_url || null, baseServerUrl),
            createdAt: row.created_at,
        }));

        return { items, page, limit, total };
    },

    async getProductById(id: number, baseServerUrl: string): Promise<any | null> {
        const query = `
            SELECT 
                p.id, p.name, p.description, p.price, p.mrp, 
                p.stock_qty, p.image_url, p.sku, p.created_at,
                pc.id as category_id, pc.name as category_name, pc.slug as category_slug, pc.icon_key as category_icon_key, pc.sort_order as category_sort_order,
                b.id as brand_id, b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo_url
            FROM products p
            JOIN product_categories pc ON p.category_id = pc.id
            JOIN brands b ON p.brand_id = b.id
            WHERE p.id = ? AND p.is_active = 1 AND pc.is_active = 1 AND b.is_active = 1
        `;
        const [rows] = await pool.query<RowDataPacket[]>(query, [id]);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: Number(row.id),
            name: row.name,
            description: row.description || null,
            price: Number(row.price),
            mrp: row.mrp ? Number(row.mrp) : null,
            stock_qty: Number(row.stock_qty || 0),
            image_url: row.image_url || null,
            image_url_full: buildProductImageUrl(row.image_url || null, baseServerUrl),
            sku: row.sku || null,
            category: {
                id: Number(row.category_id),
                name: row.category_name,
                slug: row.category_slug,
                icon_key: row.category_icon_key || null,
                sort_order: Number(row.category_sort_order || 0),
                iconKey: row.category_icon_key || null,
                sortOrder: Number(row.category_sort_order || 0),
            },
            brand: {
                id: Number(row.brand_id),
                name: row.brand_name,
                slug: row.brand_slug,
                logo_url: row.brand_logo_url || null,
                logoUrl: row.brand_logo_url || null,
            },
            created_at: row.created_at,
            // Backward-compatible aliases used by existing frontend.
            stockQty: Number(row.stock_qty || 0),
            imageUrl: buildProductImageUrl(row.image_url || null, baseServerUrl),
            imageUrlFull: buildProductImageUrl(row.image_url || null, baseServerUrl),
            createdAt: row.created_at,
        };
    },
};
