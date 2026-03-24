"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
const isProd = process.env.NODE_ENV !== 'development';
const errorHandler = (err, req, res, next) => {
    var _a, _b;
    // Always log the full error server-side for observability
    console.error('[ErrorHandler]', Object.assign({ method: req.method, path: req.path, status: (_a = err.statusCode) !== null && _a !== void 0 ? _a : 500, message: err.message }, (isProd ? {} : { stack: err.stack })));
    if (err.message === 'CORS') {
        return (0, response_1.errorResponse)(res, 'CORS', 403);
    }
    if (err.name === 'ZodError') {
        return (0, response_1.errorResponse)(res, 'Validation Error', 400, err.errors);
    }
    if (err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return (0, response_1.errorResponse)(res, 'File too large. Maximum size is 5MB', 400);
    }
    if (err.type === 'AppError') {
        return (0, response_1.errorResponse)(res, err.message, err.statusCode, (_b = err.details) !== null && _b !== void 0 ? _b : (err.code ? { code: err.code } : null));
    }
    // Never expose internal error details (stack traces, SQL errors, etc.) in production
    return (0, response_1.errorResponse)(res, 'Internal Server Error', 500, isProd ? null : err.message);
};
exports.errorHandler = errorHandler;
