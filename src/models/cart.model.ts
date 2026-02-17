import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CART_STATUS } from '../config/constants';

export interface Cart {
    id: number;
    user_id: number;
    status: string;
}

export interface CartItem {
    id?: number;
    cart_id: number;
    item_type: 'product' | 'service';
    product_id?: number;
    service_id?: number;
    qty: number;
    booking_date?: string;
    booking_time?: string;
    address_id?: number;
    notes?: string;
    unit_price?: number; // Snapshot price
}

export const CartModel = {
    async findOpenCart(userId: number): Promise<Cart | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM carts WHERE user_id = ? AND status = ?',
            [userId, CART_STATUS.OPEN]
        );
        return (rows[0] as Cart) || null;
    },

    async createCart(userId: number): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO carts (user_id, status) VALUES (?, ?)',
            [userId, CART_STATUS.OPEN]
        );
        return result.insertId;
    },

    async getCartItems(cartId: number): Promise<any[]> {
        const query = `
      SELECT ci.*, 
             p.name as product_name, p.price as product_price, p.image_url as product_image,
             s.name as service_name, s.base_price as service_price, s.image_url as service_image
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN services s ON ci.service_id = s.id
      WHERE ci.cart_id = ?
    `;
        const [rows] = await pool.query<RowDataPacket[]>(query, [cartId]);
        return rows;
    },

    async addItem(item: CartItem): Promise<number> {
        // Check if item exists (for products only, merge qty. services usually distinct entries but keeping simple)
        if (item.item_type === 'product') {
            const [existing] = await pool.query<RowDataPacket[]>(
                'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [item.cart_id, item.product_id]
            );
            if (existing.length > 0) {
                const newQty = existing[0].qty + item.qty;
                await pool.query('UPDATE cart_items SET qty = ? WHERE id = ?', [newQty, existing[0].id]);
                return existing[0].id;
            }
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO cart_items 
       (cart_id, item_type, product_id, service_id, qty, booking_date, booking_time, address_id, notes, unit_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.cart_id, item.item_type, item.product_id || null, item.service_id || null,
                item.qty, item.booking_date || null, item.booking_time || null, item.address_id || null, item.notes || null, item.unit_price || 0
            ]
        );
        return result.insertId;
    },

    async updateItem(id: number, data: Partial<CartItem>): Promise<void> {
        if (Object.keys(data).length === 0) {
            return;
        }
        const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
        const values = Object.values(data);
        await pool.query(`UPDATE cart_items SET ${fields} WHERE id = ?`, [...values, id]);
    },

    async removeItem(id: number): Promise<void> {
        await pool.query('DELETE FROM cart_items WHERE id = ?', [id]);
    },

    async checkoutCart(cartId: number): Promise<void> {
        await pool.query('UPDATE carts SET status = ? WHERE id = ?', [CART_STATUS.CHECKED_OUT, cartId]);
    },

    async verifyItemOwnership(itemId: number, userId: number): Promise<boolean> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT ci.id FROM cart_items ci 
           JOIN carts c ON ci.cart_id = c.id 
           WHERE ci.id = ? AND c.user_id = ?`,
            [itemId, userId]
        );
        return rows.length > 0;
    },

    async clearProductItems(cartId: number): Promise<void> {
        await pool.query(
            `DELETE FROM cart_items WHERE cart_id = ? AND item_type = 'product'`,
            [cartId]
        );
    }
};
