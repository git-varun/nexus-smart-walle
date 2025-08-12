import {NextFunction, Request, Response} from 'express';
import {TransactionService} from '../services/TransactionService';
import {AccountService} from '../services/AccountService';
import {createServiceLogger} from '../utils/logger';
import {Address} from 'viem';

const logger = createServiceLogger('TransactionController');

// Initialize services (no dependency injection needed - uses centralized config)
const transactionService = new TransactionService();
const accountService = new AccountService();

export const sendTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User should be available from auth middleware
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        const {to, data, value} = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient address (to) is required'
            });
        }

        // Validate recipient address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid recipient address format'
            });
        }

        // Validate value if provided
        if (value !== undefined && (isNaN(value) || value < 0)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid value amount'
            });
        }

        logger.info('Send transaction request', {
            userId: user.id,
            to,
            hasData: !!data,
            value
        });

        // Get or create user's smart account
        const accountResult = await accountService.createOrGetSmartAccount(user.id, user.email);
        if (!accountResult.success) {
            return res.status(500).json({
                success: false,
                error: accountResult.error || 'Failed to get smart account'
            });
        }

        const smartAccount = accountResult.account!;

        // Send transaction
        const result = await transactionService.sendTransaction(
            user.id,
            smartAccount.id,
            {
                to: to as Address,
                data,
                value: value?.toString()
            }
        );

        if (result.success) {
            res.json({
                success: true,
                data: {
                    transaction: result.transaction
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Send transaction controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const getTransactionByHash = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {hash} = req.params;

        if (!hash) {
            return res.status(400).json({
                success: false,
                error: 'Transaction hash is required'
            });
        }

        // Validate hash format (basic check)
        if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid transaction hash format'
            });
        }

        logger.info('Get transaction by hash request', {hash});

        const result = await transactionService.getTransactionByHash(hash);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    transaction: result.transaction
                }
            });
        } else {
            const statusCode = result.error === 'Transaction not found' ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Get transaction by hash controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // User should be available from auth middleware
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        // Parse limit from query parameters
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

        if (isNaN(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: 'Invalid limit parameter (must be between 1 and 100)'
            });
        }

        logger.info('Get transaction history request', {userId: user.id, limit});

        const result = await transactionService.getUserTransactionHistory(user.id, limit);

        if (result.success) {
            res.json({
                success: true,
                data: {
                    transactions: result.transactions,
                    count: result.transactions?.length || 0
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Get transaction history controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};

export const estimateGas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {to, data, value} = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient address (to) is required'
            });
        }

        // Validate recipient address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid recipient address format'
            });
        }

        logger.info('Gas estimation request', {to, hasData: !!data, value});

        // For now, return a simple gas estimate
        // In a more sophisticated implementation, you would:
        // 1. Use Alchemy's gas estimation APIs
        // 2. Simulate the transaction
        // 3. Account for UserOperation overhead
        const baseGas = 21000; // Base transaction gas
        const dataGas = data ? Math.ceil((data.length - 2) / 2) * 16 : 0; // Data gas (simplified)
        const userOpOverhead = 50000; // UserOperation overhead (estimated)

        const estimatedGas = baseGas + dataGas + userOpOverhead;

        res.json({
            success: true,
            data: {
                gasEstimate: estimatedGas.toString(),
                gasLimit: Math.floor(estimatedGas * 1.2).toString(), // Add 20% buffer
                breakdown: {
                    baseGas: baseGas.toString(),
                    dataGas: dataGas.toString(),
                    userOpOverhead: userOpOverhead.toString()
                }
            }
        });
    } catch (error) {
        logger.error('Gas estimation controller error', error instanceof Error ? error : new Error(String(error)));
        next(error);
    }
};
