import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ORDER_STATUS } from '../config/constants';

export interface Order {
    id: number;
    user_id: number;
    address_id?: number;
    status: string;
    payment_status: string;
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total_amount: number;
    created_at: Date;
}

export interface OrderListRow extends Order {
    item_count: number;
    first_product_name: string | null;
    first_product_image: string | null;
}

export interface OrderItem {
    id?: number;
    order_id: number;
    product_id: number;
    qty: number;
    unit_price: number;
    line_total: number;
}

export interface OrderDetailItem {
    id: number;
    product_id: number;
    qty: number;
    unit_price: number;
    line_total: number;
    product_name: string | null;
    image_url: string | null;
}

export interface OrderDetail extends Order {
    updated_at?: Date;
    referred_by_agent_id?: number | null;
    referral_code_used?: string | null;
    address: {
        id: number;
        label?: string | null;
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
    } | null;
    items: OrderDetailItem[];
}

export const OrderModel = {
    async create(order: Partial<Order>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO orders (user_id, address_id, status, payment_status, subtotal, delivery_fee, discount, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                order.user_id, order.address_id || null, order.status || ORDER_STATUS.PENDING, order.payment_status || 'pending',
                order.subtotal, order.delivery_fee || 0, order.discount || 0, order.total_amount
            ]
        );
        return result.insertId;
    },

    async createItems(items: OrderItem[]): Promise<void> {
        const values = items.map(item => [item.order_id, item.product_id, item.qty, item.unit_price, item.line_total]);
        await pool.query(
            `INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES ?`,
            [values]
        );
    },

    async findByUser(userId: number, limit = 20, offset = 0): Promise<{ orders: OrderListRow[]; total: number }> {
        const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
        const total = countRows[0].total;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                o.*,
                COALESCE((SELECT SUM(oi.qty) FROM order_items oi WHERE oi.order_id = o.id), 0) AS item_count,
                (SELECT p.name
                 FROM order_items oi
                 LEFT JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = o.id
                 ORDER BY oi.id ASC
                 LIMIT 1) AS first_product_name,
                (SELECT p.image_url
                 FROM order_items oi
                 LEFT JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = o.id
                 ORDER BY oi.id ASC
                 LIMIT 1) AS first_product_image
             FROM orders o
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return { orders: rows as OrderListRow[], total };
    },

    async findById(id: number): Promise<OrderDetail | null> {
        const [orderRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                o.*,
                a.id AS address_join_id,
                a.label AS address_label,
                a.line1 AS address_line1,
                a.line2 AS address_line2,
                a.city AS address_city,
                a.state AS address_state,
                a.postal_code AS address_postal_code,
                a.country AS address_country
             FROM orders o
             LEFT JOIN addresses a ON a.id = o.address_id
             WHERE o.id = ?`,
            [id]
        );
        if (orderRows.length === 0) return null;

        const [itemRows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.qty,
                oi.unit_price,
                oi.line_total,
                p.name as product_name,
                p.image_url
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
            [id]
        );

        const order = orderRows[0];
        const address = order.address_join_id ? {
            id: Number(order.address_join_id),
            label: order.address_label ?? null,
            line1: order.address_line1 ?? null,
            line2: order.address_line2 ?? null,
            city: order.address_city ?? null,
            state: order.address_state ?? null,
            postal_code: order.address_postal_code ?? null,
            country: order.address_country ?? null,
        } : null;

        return {
            id: Number(order.id),
            user_id: Number(order.user_id),
            address_id: order.address_id ?? undefined,
            status: order.status,
            payment_status: order.payment_status,
            subtotal: Number(order.subtotal ?? 0),
            delivery_fee: Number(order.delivery_fee ?? 0),
            discount: Number(order.discount ?? 0),
            total_amount: Number(order.total_amount ?? 0),
            created_at: order.created_at,
            updated_at: order.updated_at ?? undefined,
            referred_by_agent_id: order.referred_by_agent_id ?? null,
            referral_code_used: order.referral_code_used ?? null,
            address,
            items: itemRows as OrderDetailItem[],
        };
    },
};
