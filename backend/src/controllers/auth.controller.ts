import {Request, Response} from 'express';
import {
    comparePassword,
    generateToken,
    getAuthStatus,
    hashPassword,
    logoutUser,
    validatePasswordStrength
} from '../services/auth.service';
import {createServiceLogger, validateEmail} from '../utils';
import * as UserRepository from '../repositories/userRepository';

const logger = createServiceLogger('AuthController');

// Register new user with email and password
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email and password are required'
                }
            });
            return;
        }

        // Validate email format
        if (!validateEmail(email)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_EMAIL',
                    message: 'Invalid email format'
                }
            });
            return;
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK_PASSWORD',
                    message: passwordValidation.message
                }
            });
            return;
        }

        // Check if user already exists
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'USER_ALREADY_EXISTS',
                    message: 'User with this email already exists'
                }
            });
            return;
        }

        // Hash password before storing
        const hashedPassword = await hashPassword(password);

        // Create new user with hashed password
        const newUser = await UserRepository.createUser({
            email,
            password: hashedPassword
        });

        logger.info('User registration successful', {
            userId: newUser.id,
            email: newUser.email
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    createdAt: newUser.createdAt
                }
            }
        });

    } catch (error) {
        logger.error('User registration failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Registration failed'
            }
        });
    }
};

// Authenticate user using centralized wallet system
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;

        const user = await UserRepository.findByEmail(email);
        // Validate input
        if (!user) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'user does not exist',
                }
            });
            return;
        }

        // Validate password
        const isValidPassword = await comparePassword(password, user.password || '');

        if (isValidPassword) {
            // Generate JWT token
            const token = generateToken(user.id, user.email);

            // Update last login
            await UserRepository.updateLastLogin(user.id);

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin
                    },
                    token
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        }

    } catch (error) {
        logger.error('Centralized wallet authentication failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Authentication failed'
            }
        });
    }
};

// Logout user (JWT is stateless - client should delete token)
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        logoutUser();

        res.status(200).json({
            success: true,
            message: 'Logged out successfully. Please delete the token from client storage.'
        });

    } catch (error) {
        logger.error('Logout failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Logout failed'
            }
        });
    }
};

// Get authentication status
export const getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(200).json({
                success: true,
                data: {
                    authenticated: false
                }
            });
            return;
        }

        const result = await getAuthStatus(token);

        res.status(200).json({
            success: true,
            data: {
                authenticated: result.authenticated,
                user: result.user,
                smartAccountAddress: result.smartAccountAddress
            }
        });

    } catch (error) {
        logger.error('Get auth status failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get authentication status'
            }
        });
    }
};
