import {sessionRepository, userRepository} from '../repositories';
import {User, validateUserInput} from '../models';
import {AlchemyService} from './AlchemyService';
import {config} from '../config';
import {createServiceLogger} from '../utils/logger';
import crypto from 'crypto';

const logger = createServiceLogger('AuthService');

export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    smartAccountAddress?: string;
    error?: string;
}

export class AuthService {
    private alchemyService: AlchemyService;

    constructor() {
        this.alchemyService = new AlchemyService();
    }

    async authenticate(email: string): Promise<AuthResult> {
        try {
            logger.info('Starting authentication', {email});

            // Validate email format
            const validationError = validateUserInput({email});
            if (validationError) {
                return {
                    success: false,
                    error: validationError
                };
            }

            // First authenticate with Alchemy
            const alchemyResult = await this.alchemyService.authenticate(email);
            if (!alchemyResult.success) {
                return {
                    success: false,
                    error: alchemyResult.error || 'Alchemy authentication failed'
                };
            }

            // Find or create user in database
            let user = await userRepository.findByEmail(email);
            if (!user) {
                user = await userRepository.create({email});
                logger.info('New user created', {userId: user.id, email});
            } else {
                // Update last login
                user = await userRepository.updateLastLogin(user.id);
                logger.info('User login updated', {userId: user?.id, email});
            }

            // Create session token
            const token = this.generateToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + config.security.sessionExpiryHours);

            await sessionRepository.create({
                userId: user!.id,
                token,
                expiresAt
            });

            // Get smart account address
            const addressResult = await this.alchemyService.getSmartAccountAddress();
            const smartAccountAddress = addressResult.success ? addressResult.data : undefined;

            logger.info('Authentication successful', {
                userId: user!.id,
                email,
                smartAccountAddress
            });

            return {
                success: true,
                user: user!,
                token,
                smartAccountAddress
            };

        } catch (error) {
            logger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }

    async validateSession(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
        try {
            const session = await sessionRepository.findValidByToken(token);
            if (!session) {
                return {success: false, error: 'Invalid or expired session'};
            }

            const user = await userRepository.findById(session.userId);
            if (!user) {
                return {success: false, error: 'User not found'};
            }

            return {success: true, user};
        } catch (error) {
            logger.error('Session validation failed', error instanceof Error ? error : new Error(String(error)));
            return {success: false, error: 'Session validation failed'};
        }
    }

    async logout(token: string): Promise<{ success: boolean; error?: string }> {
        try {
            await sessionRepository.revokeSession(token);

            // Also logout from Alchemy
            this.alchemyService.logout();

            logger.info('Logout successful');
            return {success: true};
        } catch (error) {
            logger.error('Logout failed', error instanceof Error ? error : new Error(String(error)));
            return {success: false, error: 'Logout failed'};
        }
    }

    async getAuthStatus(token?: string): Promise<{
        success: boolean;
        authenticated: boolean;
        user?: User;
        alchemyStatus?: boolean;
        error?: string;
    }> {
        try {
            if (!token) {
                return {
                    success: true,
                    authenticated: false,
                    alchemyStatus: this.alchemyService.isAuthenticated()
                };
            }

            const sessionResult = await this.validateSession(token);
            if (!sessionResult.success) {
                return {
                    success: true,
                    authenticated: false,
                    error: sessionResult.error,
                    alchemyStatus: this.alchemyService.isAuthenticated()
                };
            }

            return {
                success: true,
                authenticated: true,
                user: sessionResult.user,
                alchemyStatus: this.alchemyService.isAuthenticated()
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

    private generateToken(): string {
        return crypto.randomBytes(config.security.tokenLength).toString('hex');
    }
}
