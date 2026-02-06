import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err.name === 'ZodError') {
        return errorResponse(res, 'Validation Error', 400, err.errors);
    }

    if (err.type === 'AppError') {
        return errorResponse(res, err.message, err.statusCode);
    }

    return errorResponse(res, 'Internal Server Error', 500, err.message);
};
