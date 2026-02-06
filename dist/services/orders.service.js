"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const db_1 = __importDefault(require("../config/db"));
const order_model_1 = require("../models/order.model");
const cart_model_1 = require("../models/cart.model");
const address_model_1 = require("../models/address.model");
const wallet_model_1 = require("../models/wallet.model");
const constants_1 = require("../config/constants");
exports.OrderService = {
    getOrders(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 20;
            const offset = (page - 1) * limit;
            const { orders, total } = yield order_model_1.OrderModel.findByUser(userId, limit, offset);
            return {
                data: orders,
                pagination: {
                    page,
                    pageSize: limit,
                    totalItems: total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getOrderById(userId, orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield order_model_1.OrderModel.findById(orderId);
            if (!order)
                throw { type: 'AppError', message: 'Order not found', statusCode: 404 };
            if (order.user_id !== userId)
                throw { type: 'AppError', message: 'Unauthorized', statusCode: 403 };
            return order;
        });
    },
    checkout(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Validate Address
            const address = yield address_model_1.AddressModel.findById(data.address_id);
            if (!address || address.user_id !== userId)
                throw { type: 'AppError', message: 'Invalid address', statusCode: 400 };
            // 2. Get Cart
            const cart = yield cart_model_1.CartModel.findOpenCart(userId);
            if (!cart)
                throw { type: 'AppError', message: 'Cart is empty', statusCode: 400 };
            const items = yield cart_model_1.CartModel.getCartItems(cart.id);
            const productItems = items.filter(i => i.item_type === 'product');
            if (productItems.length === 0) {
                throw { type: 'AppError', message: 'No products in cart to checkout', statusCode: 400 };
            }
            // 3. Calculate Totals
            let subtotal = 0;
            const orderItems = [];
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
            const connection = yield db_1.default.getConnection();
            try {
                yield connection.beginTransaction();
                // Check Wallet if needed
                if (data.payment_method === 'wallet') {
                    const balance = yield wallet_model_1.WalletModel.getBalance(userId);
                    if (balance < totalAmount) {
                        throw { type: 'AppError', message: 'Insufficient wallet balance', statusCode: 400 };
                    }
                    // Debit Wallet
                    yield connection.query(`INSERT INTO wallet_transactions (user_id, txn_type, source, reference_type, amount, description) 
                 VALUES (?, 'debit', 'order_payment', 'order', ?, 'Order Payment')`, [userId, totalAmount]);
                    yield connection.query('UPDATE wallets SET balance = balance - ? WHERE user_id = ?', [totalAmount, userId]);
                }
                // Create Order
                const [orderResult] = yield connection.query(`INSERT INTO orders (user_id, address_id, status, payment_status, subtotal, delivery_fee, total_amount) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    userId, data.address_id, constants_1.ORDER_STATUS.PENDING,
                    data.payment_method === 'wallet' ? 'paid' : 'pending',
                    subtotal, deliveryFee, totalAmount
                ]);
                const orderId = orderResult.insertId;
                // Create Order Items
                const itemValues = orderItems.map(item => [orderId, item.product_id, item.qty, item.unit_price, item.line_total]);
                yield connection.query(`INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES ?`, [itemValues]);
                // Update Wallet Reference ID if wallet payment
                if (data.payment_method === 'wallet') {
                    yield connection.query('UPDATE wallet_transactions SET reference_id = ? WHERE reference_type = "order" AND reference_id IS NULL AND user_id = ? ORDER BY id DESC LIMIT 1', [orderId, userId]);
                }
                // Close Cart (Mark product items as processed or close cart? 
                // Strategy: We will clone items to order, and clear them from cart or close cart. 
                // Since schema says ONE open cart per user, we should probably clear product items or close cart.)
                // Let's close the cart for simplicity as V1
                yield connection.query('UPDATE carts SET status = ? WHERE id = ?', ['checked_out', cart.id]);
                yield connection.commit();
                return { orderId, totalAmount, status: 'pending' };
            }
            catch (error) {
                yield connection.rollback();
                throw error;
            }
            finally {
                connection.release();
            }
        });
    }
};
