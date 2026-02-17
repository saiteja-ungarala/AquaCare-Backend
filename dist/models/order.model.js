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
exports.OrderModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const constants_1 = require("../config/constants");
exports.OrderModel = {
    create(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.default.query(`INSERT INTO orders (user_id, address_id, status, payment_status, subtotal, delivery_fee, discount, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                order.user_id, order.address_id || null, order.status || constants_1.ORDER_STATUS.PENDING, order.payment_status || 'pending',
                order.subtotal, order.delivery_fee || 0, order.discount || 0, order.total_amount
            ]);
            return result.insertId;
        });
    },
    createItems(items) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = items.map(item => [item.order_id, item.product_id, item.qty, item.unit_price, item.line_total]);
            yield db_1.default.query(`INSERT INTO order_items (order_id, product_id, qty, unit_price, line_total) VALUES ?`, [values]);
        });
    },
    findByUser(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            const [countRows] = yield db_1.default.query('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
            const total = countRows[0].total;
            const [rows] = yield db_1.default.query(`SELECT 
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
             LIMIT ? OFFSET ?`, [userId, limit, offset]);
            return { orders: rows, total };
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const [orderRows] = yield db_1.default.query(`SELECT 
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
             WHERE o.id = ?`, [id]);
            if (orderRows.length === 0)
                return null;
            const [itemRows] = yield db_1.default.query(`SELECT 
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
       WHERE oi.order_id = ?`, [id]);
            const order = orderRows[0];
            const address = order.address_join_id ? {
                id: Number(order.address_join_id),
                label: (_a = order.address_label) !== null && _a !== void 0 ? _a : null,
                line1: (_b = order.address_line1) !== null && _b !== void 0 ? _b : null,
                line2: (_c = order.address_line2) !== null && _c !== void 0 ? _c : null,
                city: (_d = order.address_city) !== null && _d !== void 0 ? _d : null,
                state: (_e = order.address_state) !== null && _e !== void 0 ? _e : null,
                postal_code: (_f = order.address_postal_code) !== null && _f !== void 0 ? _f : null,
                country: (_g = order.address_country) !== null && _g !== void 0 ? _g : null,
            } : null;
            return {
                id: Number(order.id),
                user_id: Number(order.user_id),
                address_id: (_h = order.address_id) !== null && _h !== void 0 ? _h : undefined,
                status: order.status,
                payment_status: order.payment_status,
                subtotal: Number((_j = order.subtotal) !== null && _j !== void 0 ? _j : 0),
                delivery_fee: Number((_k = order.delivery_fee) !== null && _k !== void 0 ? _k : 0),
                discount: Number((_l = order.discount) !== null && _l !== void 0 ? _l : 0),
                total_amount: Number((_m = order.total_amount) !== null && _m !== void 0 ? _m : 0),
                created_at: order.created_at,
                updated_at: (_o = order.updated_at) !== null && _o !== void 0 ? _o : undefined,
                referred_by_agent_id: (_p = order.referred_by_agent_id) !== null && _p !== void 0 ? _p : null,
                referral_code_used: (_q = order.referral_code_used) !== null && _q !== void 0 ? _q : null,
                address,
                items: itemRows,
            };
        });
    },
};
