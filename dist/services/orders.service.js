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
const referralCommission_service_1 = require("./referralCommission.service");
const ACTIVE_ORDER_STATUSES = new Set(['pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped']);
const DELIVERED_ORDER_STATUSES = new Set(['delivered', 'completed']);
const CANCELLED_ORDER_STATUSES = new Set(['cancelled', 'refunded']);
const normalizeStatus = (status) => (status || 'pending').toLowerCase();
const mapOrderStatusBucket = (status) => {
    const normalized = normalizeStatus(status);
    if (DELIVERED_ORDER_STATUSES.has(normalized))
        return 'delivered';
    if (CANCELLED_ORDER_STATUSES.has(normalized))
        return 'cancelled';
    if (ACTIVE_ORDER_STATUSES.has(normalized))
        return 'active';
    return 'active';
};
const mapOrderSummary = (order) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return ({
        id: Number(order.id),
        user_id: Number(order.user_id),
        address_id: (_a = order.address_id) !== null && _a !== void 0 ? _a : null,
        status: normalizeStatus(order.status),
        status_bucket: mapOrderStatusBucket(order.status),
        payment_status: normalizeStatus(order.payment_status),
        subtotal: Number((_b = order.subtotal) !== null && _b !== void 0 ? _b : 0),
        delivery_fee: Number((_c = order.delivery_fee) !== null && _c !== void 0 ? _c : 0),
        discount: Number((_d = order.discount) !== null && _d !== void 0 ? _d : 0),
        total_amount: Number((_e = order.total_amount) !== null && _e !== void 0 ? _e : 0),
        created_at: order.created_at,
        updated_at: (_f = order.updated_at) !== null && _f !== void 0 ? _f : null,
        referred_by_agent_id: (_g = order.referred_by_agent_id) !== null && _g !== void 0 ? _g : null,
        referral_code_used: (_h = order.referral_code_used) !== null && _h !== void 0 ? _h : null,
        item_count: Number((_j = order.item_count) !== null && _j !== void 0 ? _j : 0),
        first_item: order.first_product_name || order.first_product_image
            ? {
                product_name: (_k = order.first_product_name) !== null && _k !== void 0 ? _k : null,
                image_url: (_l = order.first_product_image) !== null && _l !== void 0 ? _l : null,
            }
            : null,
    });
};
const mapOrderDetail = (order) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return ({
        id: Number(order.id),
        user_id: Number(order.user_id),
        address_id: (_a = order.address_id) !== null && _a !== void 0 ? _a : null,
        status: normalizeStatus(order.status),
        status_bucket: mapOrderStatusBucket(order.status),
        payment_status: normalizeStatus(order.payment_status),
        subtotal: Number((_b = order.subtotal) !== null && _b !== void 0 ? _b : 0),
        delivery_fee: Number((_c = order.delivery_fee) !== null && _c !== void 0 ? _c : 0),
        discount: Number((_d = order.discount) !== null && _d !== void 0 ? _d : 0),
        total_amount: Number((_e = order.total_amount) !== null && _e !== void 0 ? _e : 0),
        created_at: order.created_at,
        updated_at: (_f = order.updated_at) !== null && _f !== void 0 ? _f : null,
        referred_by_agent_id: (_g = order.referred_by_agent_id) !== null && _g !== void 0 ? _g : null,
        referral_code_used: (_h = order.referral_code_used) !== null && _h !== void 0 ? _h : null,
        address: order.address,
        items: Array.isArray(order.items)
            ? order.items.map((item) => {
                var _a, _b, _c, _d, _e;
                return ({
                    id: Number(item.id),
                    order_id: Number(item.order_id),
                    product_id: Number(item.product_id),
                    qty: Number((_a = item.qty) !== null && _a !== void 0 ? _a : 0),
                    unit_price: Number((_b = item.unit_price) !== null && _b !== void 0 ? _b : 0),
                    line_total: Number((_c = item.line_total) !== null && _c !== void 0 ? _c : 0),
                    product_name: (_d = item.product_name) !== null && _d !== void 0 ? _d : null,
                    image_url: (_e = item.image_url) !== null && _e !== void 0 ? _e : null,
                });
            })
            : [],
    });
};
exports.OrderService = {
    getOrders(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.pageSize) || 20;
            const offset = (page - 1) * limit;
            const { orders, total } = yield order_model_1.OrderModel.findByUser(userId, limit, offset);
            const mappedOrders = orders.map(mapOrderSummary);
            return {
                data: mappedOrders,
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
            return mapOrderDetail(order);
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
            const normalizedReferralCode = referralCommission_service_1.ReferralCommissionService.normalizeReferralCode(data.referral_code);
            const validReferralCode = referralCommission_service_1.ReferralCommissionService.isValidReferralCodeFormat(normalizedReferralCode)
                ? normalizedReferralCode
                : null;
            // 4. Create Order Transaction
            const connection = yield db_1.default.getConnection();
            try {
                yield connection.beginTransaction();
                const referredByAgentId = yield referralCommission_service_1.ReferralCommissionService.findAgentIdByReferralCode(connection, validReferralCode);
                const referralCodeUsed = referredByAgentId ? validReferralCode : null;
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
                const [orderResult] = yield connection.query(`INSERT INTO orders (user_id, address_id, status, payment_status, subtotal, delivery_fee, total_amount, referred_by_agent_id, referral_code_used) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    userId, data.address_id, constants_1.ORDER_STATUS.PENDING,
                    data.payment_method === 'wallet' ? 'paid' : 'pending',
                    subtotal, deliveryFee, totalAmount, referredByAgentId, referralCodeUsed
                ]);
                const orderId = orderResult.insertId;
                // Create Order Items
                const itemValues = orderItems.map(item => [orderId, item.product_id, item.qty, item.unit_price, item.line_total]);
                yield connection.query(`INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES ?`, [itemValues]);
                // Generate referral-attributed commissions in the same DB transaction.
                yield referralCommission_service_1.ReferralCommissionService.generateCommissionsForOrder(connection, {
                    orderId,
                    agentId: referredByAgentId,
                });
                // Update Wallet Reference ID if wallet payment
                if (data.payment_method === 'wallet') {
                    yield connection.query('UPDATE wallet_transactions SET reference_id = ? WHERE reference_type = "order" AND reference_id IS NULL AND user_id = ? ORDER BY id DESC LIMIT 1', [orderId, userId]);
                }
                // Clear ONLY product items from cart (keep service items for bookings)
                yield connection.query(`DELETE FROM cart_items WHERE cart_id = ? AND item_type = 'product'`, [cart.id]);
                yield connection.commit();
                return {
                    orderId,
                    totalAmount,
                    status: 'pending',
                    paymentStatus: data.payment_method === 'wallet' ? 'paid' : 'pending',
                    referred_by_agent_id: referredByAgentId,
                    referral_code_used: referralCodeUsed,
                };
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
