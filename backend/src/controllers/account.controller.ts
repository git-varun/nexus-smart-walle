import {NextFunction, Request, Response} from 'express';
import {AccountService} from '../services/AccountService';
import {createServiceLogger} from '../utils/logger';

const logger = createServiceLogger('AccountController');

// Initialize services (no dependency injection needed - uses centralized config)
const accountService = new AccountService();

export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User should be available from auth middleware
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        logger.info('Create account request', {userId: user.id, email: user.email});

        const result = await accountService.createOrGetSmartAccount(user.id, user.email);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    account: result.account
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Create account controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const getAccountByAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {address} = req.params;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Account address is required'
            });
        }

        // Validate address format (basic check)
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address format'
            });
        }

        logger.info('Get account by address request', {address});

        const result = await accountService.getAccountByAddress(address);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    account: result.account
                }
            });
        } else {
            const statusCode = result.error === 'Account not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Get account by address controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const getUserAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User should be available from auth middleware
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        logger.info('Get user accounts request', {userId: user.id, email: user.email});

        const result = await accountService.getUserAccounts(user.id);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    accounts: result.accounts
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Get user accounts controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};
