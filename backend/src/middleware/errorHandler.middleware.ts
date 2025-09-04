import {NextFunction, Request, Response} from 'express';
import {ApiError} from '../types';

export const errorHandlerMiddleware = (
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`Error ${statusCode}: ${message}`, err);

    res.status(statusCode).json({
        success: false,
        error: {
            code: err.name || 'INTERNAL_ERROR',
            message,
        },
        timestamp: new Date().toISOString(),
    });
};
