import {userRepository} from '../repositories';
import {AuthStatusResult, SessionValidationResult} from '../types';
import {config} from '../config';
import {createServiceLogger} from '../utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const logger = createServiceLogger('AuthService');
const SALT_ROUNDS = 12;

/**
 * Generate JWT token for user authentication
 */
export function generateToken(userId: string, email?: string): string {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    return jwt.sign(
        {userId, email},
        jwtSecret,
        {expiresIn: `${config.security.tokenExpiryHours}h`}
    );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): { userId: string; email?: string } | null {
    try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        const decoded = jwt.verify(token, jwtSecret) as any;
        return {
            userId: decoded.userId,
            email: decoded.email
        };
    } catch (error) {
        logger.debug('JWT verification failed', error instanceof Error ? error.message : String(error));
        return null;
    }
}

/**
 * Hash a plain text password
 */
export async function hashPassword(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return {isValid: false, message: 'Password must be at least 8 characters long'};
    }

    if (!/(?=.*[a-z])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one lowercase letter'};
    }

    if (!/(?=.*[A-Z])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one uppercase letter'};
    }

    if (!/(?=.*\d)/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one number'};
    }

    if (!/(?=.*[!@#$%^&*])/.test(password)) {
        return {isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)'};
    }

    return {isValid: true};
}

/**
 * Validate JWT token and return user data
 */
export async function validateToken(token: string): Promise<SessionValidationResult> {
    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return {success: false, error: 'Invalid or expired token'};
        }

        const user = await userRepository.findById(decoded.userId);
        if (!user) {
            return {success: false, error: 'User not found'};
        }

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        };
    } catch (error) {
        logger.error('Token validation failed', error instanceof Error ? error : new Error(String(error)));
        return {success: false, error: 'Token validation failed'};
    }
}

/**
 * Logout user (JWT is stateless - client should delete token)
 */
export function logoutUser(): { success: boolean } {
    // JWT tokens are stateless, logout is handled client-side
    // The client should delete the token from local storage
    logger.info('JWT logout successful - client should delete token');
    return {success: true};
}

/**
 * Get standard authentication status (no external dependencies)
 */
export async function getAuthStatus(token?: string): Promise<AuthStatusResult> {
    try {
        if (!token) {
            return {
                success: true,
                authenticated: false
            };
        }

        const tokenResult = await validateToken(token);
        if (!tokenResult.success || !tokenResult.user) {
            return {
                success: true,
                authenticated: false,
                error: tokenResult.error || 'User not found'
            };
        }

        return {
            success: true,
            authenticated: true,
            user: {
                id: tokenResult.user.id,
                email: tokenResult.user.email,
                createdAt: tokenResult.user.createdAt,
                lastLogin: tokenResult.user.lastLogin
            }
        };
    } catch (error) {
        logger.error('Get auth status failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            authenticated: false,
            error: 'Failed to get auth status'
        };
    }
}
