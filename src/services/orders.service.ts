import pool from '../config/db';
import { OrderModel, OrderItem } from '../models/order.model';
import { CartModel } from '../models/cart.model';
import { AddressModel } from '../models/address.model';
import { WalletModel } from '../models/wallet.model';
import { ORDER_STATUS } from '../config/constants';

export const OrderService = {
    async getOrders(userId: number, query: any) {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.pageSize as string) || 20;
        const offset = (page - 1) * limit;

        const { orders, total } = await OrderModel.findByUser(userId, limit, offset);

        return {
            data: orders,
            pagination: {
                page,
                pageSize: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getOrderById(userId: number, orderId: number) {
        const order = await OrderModel.findById(orderId);
        if (!order) throw { type: 'AppError', message: 'Order not found', statusCode: 404 };
        if (order.user_id !== userId) throw { type: 'AppError', message: 'Unauthorized', statusCode: 403 };
        return order;
    },

    async checkout(userId: number, data: { address_id: number; payment_method: string }) {
        // 1. Validate Address
        const address = await AddressModel.findById(data.address_id);
        if (!address || address.user_id !== userId) throw { type: 'AppError', message: 'Invalid address', statusCode: 400 };

        // 2. Get Cart
        const cart = await CartModel.findOpenCart(userId);
        if (!cart) throw { type: 'AppError', message: 'Cart is empty', statusCode: 400 };

        const items = await CartModel.getCartItems(cart.id);
        const productItems = items.filter(i => i.item_type === 'product');

        if (productItems.length === 0) {
            throw { type: 'AppError', message: 'No products in cart to checkout', statusCode: 400 };
        }

        // 3. Calculate Totals
        let subtotal = 0;
        const orderItems: OrderItem[] = [];

        for (const item of productItems) {
            // Here we should strictly check stock in a real app
            subtotal += Number(item.product_price) * item.qty;
            orderItems.push({
                order_id: 0, // placeholder
                product_id: item.product_id,
                qty: item.qty,
                unit_price: item.product_price,
                line_total: Number(item.product_price) * item.qty
            });
        }

        const deliveryFee = subtotal > 500 ? 0 : 50; // Simple rule
        const totalAmount = subtotal + deliveryFee;

        // 4. Create Order Transaction
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check Wallet if needed
            if (data.payment_method === 'wallet') {
                const balance = await WalletModel.getBalance(userId);
                if (balance < totalAmount) {
                    throw { type: 'AppError', message: 'Insufficient wallet balance', statusCode: 400 };
                }
                // Debit Wallet
                await connection.query(
                    `INSERT INTO wallet_transactions (user_id, txn_type, source, reference_type, amount, description) 
                 VALUES (?, 'debit', 'order_payment', 'order', ?, 'Order Payment')`,
                    [userId, totalAmount]
                );
                await connection.query('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [totalAmount, userId]);
            }

            // Create Order
            const [orderResult] = await connection.query<any>(
                `INSERT INTO orders (user_id, address_id, status, payment_status, subtotal, delivery_fee, total_amount) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, data.address_id, ORDER_STATUS.PENDING,
                    data.payment_method === 'wallet' ? 'paid' : 'pending',
                    subtotal, deliveryFee, totalAmount
                ]
            );
            const orderId = orderResult.insertId;

            // Create Order Items
            const itemValues = orderItems.map(item => [orderId, item.product_id, item.qty, item.unit_price, item.line_total]);
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES ?`,
                [itemValues]
            );

            // Update Wallet Reference ID if wallet payment
            if (data.payment_method === 'wallet') {
                await connection.query('UPDATE wallet_transactions SET reference_id = ? WHERE reference_type = "order" AND reference_id IS NULL AND user_id = ? ORDER BY id DESC LIMIT 1', [orderId, userId]);
            }

            // Clear ONLY product items from cart (keep service items for bookings)
            await connection.query(
                `DELETE FROM cart_items WHERE cart_id = ? AND item_type = 'product'`,
                [cart.id]
            );

            await connection.commit();

            return { orderId, totalAmount, status: 'pending', paymentStatus: data.payment_method === 'wallet' ? 'paid' : 'pending' };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};
