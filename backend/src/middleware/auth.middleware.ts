import {NextFunction, Response} from 'express';
import {createServiceLogger} from '../utils';
import {AuthenticatedRequest} from '../types';
import {validateToken} from '../services/auth.service';

const logger = createServiceLogger('AuthMiddleware');

/**
 * Authentication middleware - validates JWT token and requires authenticated user
 */
export async function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Authentication required'
                }
            });
            return;
        }

        // Validate JWT token
        const tokenResult = await validateToken(token);
        if (!tokenResult.success || !tokenResult.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: tokenResult.error || 'Invalid or expired token'
                }
            });
            return;
        }

        // Attach user info to request
        req.user = {
            id: tokenResult.user.id,
            email: tokenResult.user.email || ''
        };

        next();
    } catch (error) {
        logger.error('Authentication middleware error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed'
            }
        });
    }
}

/**
 * Extract user ID from authenticated request
 */
export function getUserId(req: AuthenticatedRequest): string | null {
    return req.user?.id || null;
}

/**
 * Extract JWT token from request header
 */
export function getToken(req: AuthenticatedRequest): string | null {
    const authHeader = req.headers.authorization;
    return authHeader && authHeader.split(' ')[1] || null;
}
