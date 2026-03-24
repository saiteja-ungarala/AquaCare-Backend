"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const technician_domain_1 = require("../utils/technician-domain");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, 'Unauthorized: Invalid token', 401);
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => (req, res, next) => {
    if (!req.user) {
        return (0, response_1.errorResponse)(res, 'Unauthorized', 401);
    }
    const userRole = req.user.role;
    const isAuthorized = roles.some((role) => (0, technician_domain_1.rolesMatch)(userRole, role));
    if (!isAuthorized) {
        return (0, response_1.errorResponse)(res, 'Forbidden: Insufficient permissions', 403);
    }
    next();
};
exports.authorize = authorize;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.errorResponse)(res, 'Unauthorized', 401);
        }
        const userRole = req.user.role;
        if (!(0, technician_domain_1.rolesMatch)(userRole, role)) {
            return (0, response_1.errorResponse)(res, 'Forbidden: Insufficient permissions', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
