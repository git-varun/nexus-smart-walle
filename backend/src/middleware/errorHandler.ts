import {NextFunction, Request, Response} from 'express';

export interface ApiError extends Error {
    statusCode?: number;
}

export const errorHandler = (
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
