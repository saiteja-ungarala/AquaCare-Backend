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
exports.AddressModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.AddressModel = {
    findAll(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [userId]);
            return rows;
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM addresses WHERE id = ?', [id]);
            return rows[0] || null;
        });
    },
    create(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.default.query(`INSERT INTO addresses (user_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                address.user_id, address.label || null, address.line1, address.line2 || null,
                address.city, address.state, address.postal_code, address.country || 'India',
                address.latitude || null, address.longitude || null, address.is_default ? 1 : 0
            ]);
            return result.insertId;
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
            const values = Object.values(data);
            yield db_1.default.query(`UPDATE addresses SET ${fields} WHERE id = ?`, [...values, id]);
        });
    },
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query('DELETE FROM addresses WHERE id = ?', [id]);
        });
    },
    setDefault(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield db_1.default.getConnection();
            try {
                yield connection.beginTransaction();
                yield connection.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
                yield connection.query('UPDATE addresses SET is_default = 1 WHERE id = ? and user_id = ?', [addressId, userId]);
                yield connection.commit();
            }
            catch (err) {
                yield connection.rollback();
                throw err;
            }
            finally {
                connection.release();
            }
        });
    }
};
