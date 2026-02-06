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
            const [rows] = yield db_1.default.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [userId, limit, offset]);
            return { orders: rows, total };
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [orderRows] = yield db_1.default.query('SELECT * FROM orders WHERE id = ?', [id]);
            if (orderRows.length === 0)
                return null;
            const [itemRows] = yield db_1.default.query(`SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`, [id]);
            return Object.assign(Object.assign({}, orderRows[0]), { items: itemRows });
        });
    },
};
