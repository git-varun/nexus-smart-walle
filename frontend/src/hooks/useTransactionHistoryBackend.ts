import {useState, useCallback, useEffect} from 'react';
import {Address} from 'viem';
import {apiClient, TransactionResult} from '../services/apiClient';
import {useToast} from './useToast';

interface TransactionHistoryItem {
    hash: string;
    userOpHash?: string;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: number;
    receipt?: any;
}

export function useTransactionHistoryBackend() {
    const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {toast} = useToast();

    // Send a new transaction
    const sendTransaction = useCallback(async (
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<TransactionResult> => {
        try {
            setError(null);

            const response = await apiClient.sendTransaction(to, data, value);

            if (response.success) {
                // Add transaction to local history
                const newTransaction: TransactionHistoryItem = {
                    hash: response.data.hash,
                    userOpHash: response.data.userOpHash,
                    to,
                    value: value?.toString() || '0',
                    data,
                    status: response.data.success ? 'success' : 'pending',
                    timestamp: Date.now(),
                    receipt: response.data.receipt,
                };

                setTransactions(prev => [newTransaction, ...prev]);

                toast({
                    title: 'Transaction Sent',
                    description: `Transaction hash: ${response.data.hash.slice(0, 10)}...`,
                    variant: 'success'
                });

                return response.data;
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
            setError(errorMessage);

            toast({
                title: 'Transaction Failed',
                description: errorMessage,
                variant: 'error'
            });

            throw err;
        }
    }, [toast]);

    // Check transaction status
    const checkTransactionStatus = useCallback(async (hash: string) => {
        try {
            const response = await apiClient.getTransactionStatus(hash);

            if (response.success) {
                // Update transaction status in local history
                setTransactions(prev =>
                    prev.map(tx =>
                        tx.hash === hash
                            ? {...tx, status: response.data.status, receipt: response.data.receipt}
                            : tx
                    )
                );

                return response.data;
            } else {
                console.warn('Failed to check transaction status:', response.error?.message);
                return null;
            }
        } catch (err) {
            console.error('Error checking transaction status:', err);
            return null;
        }
    }, []);

    // Refresh all pending transactions
    const refreshPendingTransactions = useCallback(async () => {
        const pendingTxs = transactions.filter(tx => tx.status === 'pending');

        for (const tx of pendingTxs) {
            await checkTransactionStatus(tx.hash);
        }
    }, [transactions, checkTransactionStatus]);

    // Clear transaction history
    const clearHistory = useCallback(() => {
        setTransactions([]);
        setError(null);
    }, []);

    // Get transaction by hash
    const getTransaction = useCallback((hash: string) => {
        return transactions.find(tx => tx.hash === hash);
    }, [transactions]);

    // Get transactions by status
    const getTransactionsByStatus = useCallback((status: 'pending' | 'success' | 'failed') => {
        return transactions.filter(tx => tx.status === status);
    }, [transactions]);

    // Auto-refresh pending transactions periodically
    useEffect(() => {
        const pendingTxs = transactions.filter(tx => tx.status === 'pending');

        if (pendingTxs.length > 0) {
            const interval = setInterval(() => {
                refreshPendingTransactions();
            }, 10000); // Check every 10 seconds

            return () => clearInterval(interval);
        }
    }, [transactions, refreshPendingTransactions]);

    return {
        // State
        transactions,
        isLoading,
        error,

        // Actions
        sendTransaction,
        checkTransactionStatus,
        refreshPendingTransactions,
        clearHistory,

        // Getters
        getTransaction,
        getTransactionsByStatus,

        // Computed values
        pendingTransactions: transactions.filter(tx => tx.status === 'pending'),
        successfulTransactions: transactions.filter(tx => tx.status === 'success'),
        failedTransactions: transactions.filter(tx => tx.status === 'failed'),
        totalTransactions: transactions.length,
    };
}
