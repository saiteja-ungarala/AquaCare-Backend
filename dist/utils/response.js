"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = 'Something went wrong', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        details,
    });
};
exports.errorResponse = errorResponse;
