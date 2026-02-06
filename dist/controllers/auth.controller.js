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
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.refresh = exports.login = exports.signup = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const signup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_service_1.AuthService.signup(Object.assign(Object.assign({}, req.body), { password_hash: req.body.password // Temporarily map password
         }));
        return (0, response_1.successResponse)(res, result, 'User created successfully', 201);
    }
    catch (error) {
        next(error);
    }
});
exports.signup = signup;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_service_1.AuthService.login(req.body.email, req.body.password);
        return (0, response_1.successResponse)(res, result, 'Login successful');
    }
    catch (error) {
        next(error);
    }
});
exports.login = login;
const refresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_service_1.AuthService.refreshToken(req.body.refreshToken);
        return (0, response_1.successResponse)(res, result, 'Token refreshed');
    }
    catch (error) {
        next(error);
    }
});
exports.refresh = refresh;
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Expect refresh token in body for now, to revoke specific session
        yield auth_service_1.AuthService.logout(req.body.refreshToken);
        return (0, response_1.successResponse)(res, null, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.logout = logout;
const me = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // User is attached to req by auth middleware
    return (0, response_1.successResponse)(res, { user: req.user });
});
exports.me = me;
