import {BaseRepository} from './BaseRepository';
import {CreateTransactionInput, Transaction, TransactionStatus, UpdateTransactionInput} from '../models';

// In-memory storage for transactions
const transactionStorage = new Map<string, Transaction>();

export class TransactionRepository extends BaseRepository<Transaction, CreateTransactionInput, UpdateTransactionInput> {

    // Override update to set updatedAt
    async update(id: string, data: UpdateTransactionInput): Promise<Transaction | null> {
        const updateData = {...data, updatedAt: new Date()} as UpdateTransactionInput & { updatedAt: Date };
        return super.update(id, updateData);
    }

    // Transaction-specific methods
    async findByHash(hash: string): Promise<Transaction | null> {
        return this.findOneBy('hash', hash);
    }

    async findByUserOpHash(userOpHash: string): Promise<Transaction | null> {
        const allTransactions = Array.from(this.getStorage().values());
        return allTransactions.find(tx => tx.userOpHash === userOpHash) || null;
    }

    async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
        const transactions = await this.findBy('userId', userId, limit);
        // Sort by creation date (newest first)
        return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async findBySmartAccountId(smartAccountId: string, limit?: number): Promise<Transaction[]> {
        const transactions = await this.findBy('smartAccountId', smartAccountId, limit);
        // Sort by creation date (newest first)
        return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async findByStatus(status: TransactionStatus): Promise<Transaction[]> {
        return this.findBy('status', status);
    }

    async findPendingTransactions(): Promise<Transaction[]> {
        return this.findByStatus('pending');
    }

    async findRecentTransactions(limit: number = 50): Promise<Transaction[]> {
        const allTransactions = Array.from(this.getStorage().values());
        return allTransactions
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    async updateStatus(id: string, status: TransactionStatus, gasUsed?: string): Promise<Transaction | null> {
        const updateData: UpdateTransactionInput = {status};
        if (gasUsed) {
            updateData.gasUsed = gasUsed;
        }
        return this.update(id, updateData);
    }

    async markAsConfirmed(id: string, gasUsed?: string): Promise<Transaction | null> {
        return this.updateStatus(id, 'confirmed', gasUsed);
    }

    async markAsFailed(id: string): Promise<Transaction | null> {
        return this.updateStatus(id, 'failed');
    }

    // Bulk operations
    async bulkUpdateStatus(ids: string[], status: TransactionStatus): Promise<void> {
        for (const id of ids) {
            await this.updateStatus(id, status);
        }
    }

    // Statistics
    async getStats(): Promise<{
        totalTransactions: number;
        transactionsByStatus: Record<TransactionStatus, number>;
        totalValue: string; // sum of all transaction values
        averageGasUsed: string;
        transactionsLast24h: number;
    }> {
        const allTransactions = Array.from(this.getStorage().values());
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const transactionsByStatus: Record<TransactionStatus, number> = {
            pending: 0,
            confirmed: 0,
            failed: 0
        };

        let totalValue = BigInt(0);
        let totalGasUsed = BigInt(0);
        let gasUsedCount = 0;

        for (const tx of allTransactions) {
            // Count by status
            transactionsByStatus[tx.status]++;

            // Sum values
            if (tx.value) {
                try {
                    totalValue += BigInt(tx.value);
                } catch {
                    // Ignore invalid values
                }
            }

            // Sum gas used
            if (tx.gasUsed) {
                try {
                    totalGasUsed += BigInt(tx.gasUsed);
                    gasUsedCount++;
                } catch {
                    // Ignore invalid gas values
                }
            }
        }

        const averageGasUsed = gasUsedCount > 0 ? (totalGasUsed / BigInt(gasUsedCount)).toString() : '0';
        const transactionsLast24h = allTransactions.filter(tx => tx.createdAt > yesterday).length;

        return {
            totalTransactions: allTransactions.length,
            transactionsByStatus,
            totalValue: totalValue.toString(),
            averageGasUsed,
            transactionsLast24h
        };
    }

    protected getStorage(): Map<string, Transaction> {
        return transactionStorage;
    }

    protected createEntity(id: string, data: CreateTransactionInput): Transaction {
        const now = new Date();
        return {
            id,
            userId: data.userId,
            smartAccountId: data.smartAccountId,
            hash: data.hash,
            userOpHash: data.userOpHash,
            to: data.to,
            value: data.value,
            data: data.data,
            status: data.status,
            createdAt: now,
            updatedAt: now
        };
    }
}
