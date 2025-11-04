import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {createUserAccount, getAccountDetails, getUserAccounts} from '../services/account.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('AccountController');

export async function createSmartAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required'
                }
            });
            return;
        }

        // Extract chainId and accountType with defaults
        const chainId = req.body.chainId || 84532; // Default to Base Sepolia
        const accountType = 'la-v2'; // Default to Light Account v2

        // Validate chainId
        if (chainId <= 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAIN_ID',
                    message: 'Valid chain ID is required'
                }
            });
            return;
        }

        // Validate accountType
        if (accountType.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ACCOUNT_TYPE',
                    message: 'Valid account type is required'
                }
            });
            return;
        }

        logger.info(`Creating account for user ${userId}`, {
            chainId,
            accountType
        });

        const result = await createUserAccount(userId, chainId, accountType);

        if (result.success) {
            res.status(201).json({
                success: true,
                data: {
                    smartAccount: result.account
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'SMART_ACCOUNT_CREATION_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Create or get smart account failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create or get smart account'
            }
        });
    }
}

export async function getMySmartAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User authentication required'
                }
            });
            return;
        }

        const {chainId} = req.query;

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required as query parameter'
                }
            });
            return;
        }

        const result = await getUserAccounts(userId, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    accounts: result.accounts || []
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'GET_ACCOUNTS_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get my smart account failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get smart account'
            }
        });
    }
}

export async function getSmartAccountDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const {address} = req.params;
        const {chainId} = req.query;

        if (!address) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ADDRESS',
                    message: 'Smart account address is required'
                }
            });
            return;
        }

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required as query parameter'
                }
            });
            return;
        }

        const result = await getAccountDetails(address, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    account: result.account
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ACCOUNT_NOT_FOUND',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get smart account details failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get smart account details'
            }
        });
    }
}
