import {NextFunction, Request, Response} from 'express';
import {AuthService} from '../services/AuthService';
import {createServiceLogger} from '../utils/logger';

const logger = createServiceLogger('AuthController');

// Initialize service (no dependency injection needed - uses centralized config)
const authService = new AuthService();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        logger.info('Authentication request', {email});

        const result = await authService.authenticate(email);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    user: result.user,
                    token: result.token,
                    smartAccountAddress: result.smartAccountAddress
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Authentication controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Authorization token is required'
            });
        }

        logger.info('Logout request', {hasToken: !!token});

        const result = await authService.logout(token);

        if (result.success) {
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Logout controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        logger.info('Get status request', {hasToken: !!token});

        const result = await authService.getAuthStatus(token);

        res.json({
            success: result.success,
            data: {
                authenticated: result.authenticated,
                user: result.user,
                alchemyConnected: result.alchemyStatus
            },
            error: result.error
        });
    } catch (error) {
        logger.error('Get status controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

// Middleware to validate authentication
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authorization token is required'
            });
        }

        const result = await authService.validateSession(token);

        if (!result.success) {
            return res.status(401).json({
                success: false,
                error: result.error || 'Invalid or expired session'
            });
        }

        // Add user to request object for downstream use
        (req as any).user = result.user;
        next();
    } catch (error) {
        logger.error('Auth middleware error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: 'Authentication middleware error'
        });
    }
};
