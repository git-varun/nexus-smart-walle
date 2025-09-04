import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {getAccountDetails, getOrCreateUserAccount, getUserAccountInfo} from '../services/account.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('AccountController');

export async function createOrGetSmartAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {chainId} = req.body;

        if (!chainId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHAIN_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        const result = await getOrCreateUserAccount(userId, chainId);

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

        const result = await getUserAccountInfo(userId, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    account: result.account
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'GET_ACCOUNT_FAILED',
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
