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
exports.UserModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.UserModel = {
    create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const [result] = yield db_1.default.query(`INSERT INTO users (role, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)`, [user.role, user.full_name, user.email, user.phone, user.password_hash]);
            return result.insertId;
        });
    },
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0] || null;
        });
    },
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM users WHERE id = ?', [id]);
            return rows[0] || null;
        });
    },
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = Object.keys(data).map((key) => `${key} = ?`).join(', ');
            const values = Object.values(data);
            yield db_1.default.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
        });
    },
    // Auth Session Methods
    createSession(userId, refreshToken, userAgent, ip, expiresAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query(`INSERT INTO auth_sessions (user_id, refresh_token, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)`, [userId, refreshToken, userAgent, ip, expiresAt]);
        });
    },
    findSessionByToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield db_1.default.query('SELECT * FROM auth_sessions WHERE refresh_token = ? AND revoked_at IS NULL AND expires_at > NOW()', [refreshToken]);
            return rows[0] || null;
        });
    },
    revokeSession(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token = ?', [refreshToken]);
        });
    },
    revokeAllUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = ?', [userId]);
        });
    }
};
