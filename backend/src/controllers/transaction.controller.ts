import {Response} from 'express';
import {AuthenticatedRequest, getUserId} from '../middleware';
import {
    estimateGas,
    getGasPriceObject,
    getUserOperationStatus,
    getUserTransactionHistory,
    sendTransaction as sendTransactionService
} from '../services/transaction.service';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('TransactionController');

export async function sendTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {to, data, value, chainId, bundlerId} = req.body;

        if (!to) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_RECIPIENT',
                    message: 'Recipient address is required'
                }
            });
            return;
        }

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

        if (!bundlerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Send transaction request', {userId, to, hasData: !!data, value, chainId, bundlerId});

        const result = await sendTransactionService(
            userId,
            chainId,
            bundlerId,
            {to, data, value: value?.toString()}
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    transaction: result.transaction
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TRANSACTION_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Send transaction failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send transaction'
            }
        });
    }
}

export async function getOperationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const {callerId, chainId} = req.body;

        if (!callerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CALLER_ID',
                    message: 'Caller ID is required'
                }
            });
            return;
        }

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

        logger.info('Getting user operation status', callerId, chainId);

        const result = await getUserOperationStatus(callerId, chainId);

        if (result.success) {
            res.status(200).json({
                success: true,
                data: result.receipts
            })
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'STATUS_CALL_FAILED',
                    message: result.error
                }
            })
        }
    } catch (error) {
        logger.error('Getting user operation status failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to send transaction'
            }
        });
    }
}

export async function getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        logger.info('Get transaction history request', {userId, chainId});

        const result = await getUserTransactionHistory(userId, parseInt(chainId as string));

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    transactions: result.transactions,
                    count: result.transactions?.length || 0
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'HISTORY_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get transaction history failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction history'
            }
        });
    }
}

export async function getGasEstimation(req: AuthenticatedRequest, res: Response): Promise<void> {
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

        const {to, data, value, chainId, bundler} = req.body;

        if (!to) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_RECIPIENT',
                    message: 'Recipient address is required'
                }
            });
            return;
        }

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

        if (!bundler) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        // Convert chainId to number for consistent comparison
        const chainIdNumber = parseInt(chainId.toString(), 10);

        logger.info('Gas estimation request', {userId, to, hasData: !!data, value, chainId: chainIdNumber});

        const result = await estimateGas(
            userId,
            chainIdNumber,
            bundler,
            {to, data, value: value?.toString()}
        );

        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    gasEstimate: result.gasEstimate
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'ESTIMATION_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Gas estimation failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to estimate gas'
            }
        });
    }
}

export async function getGasPrice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

        const {chainId, bundlerId} = req.body;
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

        if (!bundlerId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BUNDLER_ID',
                    message: 'Chain ID is required'
                }
            });
            return;
        }

        logger.info('Get latest transaction gas price', chainId, bundlerId);

        const result = await getGasPriceObject(chainId, bundlerId);

        if (result.success) {
            res.status(200).json({
                success: true,
                data: result.gasPrice
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    code: 'GAS_PRICE_FAILED',
                    message: result.error
                }
            });
        }

    } catch (error) {
        logger.error('Get transaction history failed', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get transaction history'
            }
        });
    }
}
