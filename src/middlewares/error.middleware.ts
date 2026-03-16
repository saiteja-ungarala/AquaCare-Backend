import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { errorResponse } from '../utils/response';

const isProd = process.env.NODE_ENV !== 'development';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Always log the full error server-side for observability
    console.error('[ErrorHandler]', {
        method: req.method,
        path: req.path,
        status: err.statusCode ?? 500,
        message: err.message,
        ...(isProd ? {} : { stack: err.stack }),
    });

    if (err.message === 'CORS') {
        return errorResponse(res, 'CORS', 403);
    }

    if (err.name === 'ZodError') {
        return errorResponse(res, 'Validation Error', 400, err.errors);
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, 'File too large. Maximum size is 5MB', 400);
    }

    if (err.type === 'AppError') {
        return errorResponse(res, err.message, err.statusCode, err.code ? { code: err.code } : null);
    }

    // Never expose internal error details (stack traces, SQL errors, etc.) in production
    return errorResponse(
        res,
        'Internal Server Error',
        500,
        isProd ? null : err.message,
    );
};
