import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { errorResponse } from '../utils/response';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded as any;
        next();
    } catch (error) {
        return errorResponse(res, 'Unauthorized: Invalid token', 401);
    }
};

export const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    if (!roles.includes((req.user as any).role)) {
        return errorResponse(res, 'Forbidden: Insufficient permissions', 403);
    }

    next();
};

export const requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        const userRole = (req.user as any).role;
        if (userRole !== role) {
            return errorResponse(res, 'Forbidden: Insufficient permissions', 403);
        }

        next();
    };
};
