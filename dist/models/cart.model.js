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
exports.CartModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const constants_1 = require("../config/constants");
exports.CartModel = {
    findOpenCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM carts WHERE user_id = ? AND status = ?', [userId, constants_1.CART_STATUS.OPEN]);
            return rows[0] || null;
        });
    },
    createCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.default.query('INSERT INTO carts (user_id, status) VALUES (?, ?)', [userId, constants_1.CART_STATUS.OPEN]);
            return result.insertId;
        });
    },
    getCartItems(cartId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      SELECT ci.*, 
             p.name as product_name, p.price as product_price, p.image_url as product_image,
             s.name as service_name, s.base_price as service_price, s.image_url as service_image
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN services s ON ci.service_id = s.id
      WHERE ci.cart_id = ?
    `;
            const [rows] = yield db_1.default.query(query, [cartId]);
            return rows;
        });
    },
    addItem(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if item exists (for products only, merge qty. services usually distinct entries but keeping simple)
            if (item.item_type === 'product') {
                const [existing] = yield db_1.default.query('SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ?', [item.cart_id, item.product_id]);
                if (existing.length > 0) {
                    const newQty = existing[0].qty + item.qty;
                    yield db_1.default.query('UPDATE cart_items SET qty = ? WHERE id = ?', [newQty, existing[0].id]);
                    return existing[0].id;
                }
            }
            const [result] = yield db_1.default.query(`INSERT INTO cart_items 
       (cart_id, item_type, product_id, service_id, qty, booking_date, booking_time, address_id, notes, unit_price) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                item.cart_id, item.item_type, item.product_id || null, item.service_id || null,
                item.qty, item.booking_date || null, item.booking_time || null, item.address_id || null, item.notes || null, item.unit_price || 0
            ]);
            return result.insertId;
        });
    },
    updateItem(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
            const values = Object.values(data);
            yield db_1.default.query(`UPDATE cart_items SET ${fields} WHERE id = ?`, [...values, id]);
        });
    },
    removeItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query('DELETE FROM cart_items WHERE id = ?', [id]);
        });
    },
    checkoutCart(cartId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query('UPDATE carts SET status = ? WHERE id = ?', [constants_1.CART_STATUS.CHECKED_OUT, cartId]);
        });
    },
    verifyItemOwnership(itemId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query(`SELECT ci.id FROM cart_items ci 
           JOIN carts c ON ci.cart_id = c.id 
           WHERE ci.id = ? AND c.user_id = ?`, [itemId, userId]);
            return rows.length > 0;
        });
    },
    clearProductItems(cartId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query(`DELETE FROM cart_items WHERE cart_id = ? AND item_type = 'product'`, [cartId]);
        });
    }
};
