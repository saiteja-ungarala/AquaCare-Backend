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
exports.ProductModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.ProductModel = {
    findAll(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM products WHERE is_active = 1';
            const values = [];
            if (params.category) {
                query += ' AND category = ?';
                values.push(params.category);
            }
            if (params.search) {
                query += ' AND (name LIKE ? OR description LIKE ?)';
                values.push(`%${params.search}%`, `%${params.search}%`);
            }
            const [countRows] = yield db_1.default.query(`SELECT COUNT(*) as total FROM (${query}) as t`, values);
            const total = countRows[0].total;
            if (params.limit) {
                query += ' LIMIT ? OFFSET ?';
                values.push(params.limit, params.offset || 0);
            }
            const [rows] = yield db_1.default.query(query, values);
            return { products: rows, total };
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
            return rows[0] || null;
        });
    },
};
