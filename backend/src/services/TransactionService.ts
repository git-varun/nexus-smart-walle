import {transactionRepository, userRepository} from '../repositories';
import {AlchemyService} from './AlchemyService';
import {createServiceLogger} from '../utils/logger';
import {Address} from 'viem';

const logger = createServiceLogger('TransactionService');

export interface TransactionRequest {
    to: Address;
    data?: string;
    value?: string;
}

export interface TransactionInfo {
    id: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class TransactionService {
    private alchemyService: AlchemyService;

    constructor() {
        this.alchemyService = new AlchemyService();
    }

    async sendTransaction(
        userId: string,
        smartAccountId: string,
        request: TransactionRequest
    ): Promise<{
        success: boolean;
        transaction?: TransactionInfo;
        error?: string;
    }> {
        try {
            logger.info('Sending transaction', {userId, smartAccountId, to: request.to});

            // Get user to authenticate with Alchemy
            const user = await userRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Authenticate AlchemyService with user's email
            const authResult = await this.alchemyService.authenticate(user.email);
            if (!authResult.success) {
                return {
                    success: false,
                    error: authResult.error || 'Failed to authenticate with Alchemy'
                };
            }

            // Send transaction via Alchemy
            const alchemyResult = await this.alchemyService.sendTransaction({
                to: request.to,
                data: request.data as any,
                value: request.value ? BigInt(request.value) : undefined
            });

            if (!alchemyResult.success) {
                return {
                    success: false,
                    error: alchemyResult.error || 'Transaction failed'
                };
            }

            const alchemyTx = alchemyResult.data!;

            // Store transaction in database
            const dbTransaction = await transactionRepository.create({
                userId,
                smartAccountId,
                hash: alchemyTx.hash,
                userOpHash: alchemyTx.userOpHash,
                to: request.to,
                value: request.value,
                data: request.data,
                status: alchemyTx.success ? 'confirmed' : 'pending'
            });

            logger.info('Transaction stored in database', {
                transactionId: dbTransaction.id,
                hash: dbTransaction.hash
            });

            return {
                success: true,
                transaction: {
                    id: dbTransaction.id,
                    hash: dbTransaction.hash,
                    userOpHash: dbTransaction.userOpHash,
                    to: dbTransaction.to,
                    value: dbTransaction.value,
                    data: dbTransaction.data,
                    status: dbTransaction.status,
                    gasUsed: dbTransaction.gasUsed,
                    createdAt: dbTransaction.createdAt,
                    updatedAt: dbTransaction.updatedAt
                }
            };

        } catch (error) {
            logger.error('Send transaction failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send transaction'
            };
        }
    }

    async getTransactionByHash(hash: string): Promise<{
        success: boolean;
        transaction?: TransactionInfo;
        error?: string;
    }> {
        try {
            logger.info('Getting transaction by hash', {hash});

            const dbTransaction = await transactionRepository.findByHash(hash);
            if (!dbTransaction) {
                return {
                    success: false,
                    error: 'Transaction not found'
                };
            }

            return {
                success: true,
                transaction: {
                    id: dbTransaction.id,
                    hash: dbTransaction.hash,
                    userOpHash: dbTransaction.userOpHash,
                    to: dbTransaction.to,
                    value: dbTransaction.value,
                    data: dbTransaction.data,
                    status: dbTransaction.status,
                    gasUsed: dbTransaction.gasUsed,
                    createdAt: dbTransaction.createdAt,
                    updatedAt: dbTransaction.updatedAt
                }
            };

        } catch (error) {
            logger.error('Get transaction by hash failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get transaction'
            };
        }
    }

    async getUserTransactionHistory(userId: string, limit: number = 50): Promise<{
        success: boolean;
        transactions?: TransactionInfo[];
        error?: string;
    }> {
        try {
            logger.info('Getting user transaction history', {userId, limit});

            const dbTransactions = await transactionRepository.findByUserId(userId, limit);

            const transactions: TransactionInfo[] = dbTransactions.map((tx: any) => ({
                id: tx.id,
                hash: tx.hash,
                userOpHash: tx.userOpHash,
                to: tx.to,
                value: tx.value,
                data: tx.data,
                status: tx.status,
                gasUsed: tx.gasUsed,
                createdAt: tx.createdAt,
                updatedAt: tx.updatedAt
            }));

            return {
                success: true,
                transactions
            };

        } catch (error) {
            logger.error('Get user transaction history failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get transaction history'
            };
        }
    }

    async updateTransactionStatus(
        transactionId: string,
        status: 'pending' | 'confirmed' | 'failed',
        gasUsed?: string
    ): Promise<{
        success: boolean;
        transaction?: TransactionInfo;
        error?: string;
    }> {
        try {
            logger.info('Updating transaction status', {transactionId, status, gasUsed});

            const updatedTransaction = await transactionRepository.updateStatus(transactionId, status, gasUsed);

            if (!updatedTransaction) {
                return {
                    success: false,
                    error: 'Transaction not found'
                };
            }

            return {
                success: true,
                transaction: {
                    id: updatedTransaction.id,
                    hash: updatedTransaction.hash,
                    userOpHash: updatedTransaction.userOpHash,
                    to: updatedTransaction.to,
                    value: updatedTransaction.value,
                    data: updatedTransaction.data,
                    status: updatedTransaction.status,
                    gasUsed: updatedTransaction.gasUsed,
                    createdAt: updatedTransaction.createdAt,
                    updatedAt: updatedTransaction.updatedAt
                }
            };

        } catch (error) {
            logger.error('Update transaction status failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update transaction status'
            };
        }
    }
}
