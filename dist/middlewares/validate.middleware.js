"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        // Apply transforms back to request
        req.body = parsed.body;
        req.query = parsed.query || req.query;
        req.params = parsed.params || req.params;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return (0, response_1.errorResponse)(res, 'Validation Error', 400, error.errors);
        }
        next(error);
    }
};
exports.validate = validate;
