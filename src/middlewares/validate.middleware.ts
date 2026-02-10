import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse(res, 'Validation Error', 400, error.errors);
        }
        next(error);
    }
};
