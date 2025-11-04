import {NextFunction, Request, Response} from 'express';
import {logger} from "../utils";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error('Error:', message, err);

    res.status(statusCode).json({
        success: false,
        error: message
    });
}

// Alias for backward compatibility
export const errorHandlerMiddleware = errorHandler;
