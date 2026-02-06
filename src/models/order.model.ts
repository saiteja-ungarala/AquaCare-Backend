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

export interface OrderItem {
    id?: number;
    order_id: number;
    product_id: number;
    qty: number;
    unit_price: number;
    line_total: number;
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

    async findByUser(userId: number, limit = 20, offset = 0): Promise<{ orders: Order[]; total: number }> {
        const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
        const total = countRows[0].total;

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );
        return { orders: rows as Order[], total };
    },

    async findById(id: number): Promise<any | null> {
        const [orderRows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [id]);
        if (orderRows.length === 0) return null;

        const [itemRows] = await pool.query<RowDataPacket[]>(
            `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
            [id]
        );

        return { ...orderRows[0], items: itemRows };
    },
};
