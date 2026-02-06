"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err.name === 'ZodError') {
        return (0, response_1.errorResponse)(res, 'Validation Error', 400, err.errors);
    }
    if (err.type === 'AppError') {
        return (0, response_1.errorResponse)(res, err.message, err.statusCode);
    }
    return (0, response_1.errorResponse)(res, 'Internal Server Error', 500, err.message);
};
exports.errorHandler = errorHandler;
