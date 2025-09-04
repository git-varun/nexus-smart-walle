import {useCallback, useEffect, useState} from 'react';
import {Address} from 'viem';
import {apiClient, GasEstimate, TransactionHistory, TransactionResult} from '../services/apiClient';
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
    const [isEstimating, setIsEstimating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
    const {toast} = useToast();

    // Estimate gas for a transaction
    const estimateGas = useCallback(async (
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<GasEstimate | null> => {
        try {
            setIsEstimating(true);
            setError(null);

            const response = await apiClient.estimateGas(to, data, value);

            if (response.success && response.data) {
                setGasEstimate(response.data);
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Gas estimation failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gas estimation failed';
            setError(errorMessage);

            toast({
                title: 'Gas Estimation Failed',
                description: errorMessage,
                variant: 'error'
            });

            return null;
        } finally {
            setIsEstimating(false);
        }
    }, [toast]);

    // Send a new transaction
    const sendTransaction = useCallback(async (
        token: string,
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<TransactionResult> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.sendTransaction(token, to, data, value);

            if (response.success && response.data) {
                // Add transaction to local history
                const newTransaction: TransactionHistoryItem = {
                    hash: response.data.transaction.hash,
                    userOpHash: response.data.transaction.userOpHash,
                    to,
                    value: value?.toString() || '0',
                    data,
                    status: response.data.transaction.status === 'confirmed' ? 'success' : 'pending',
                    timestamp: Date.now(),
                };

                setTransactions(prev => [newTransaction, ...prev]);

                toast({
                    title: 'Transaction Sent',
                    description: `Transaction hash: ${response.data.transaction.hash.slice(0, 10)}...`,
                    variant: 'success'
                });

                return response.data.transaction;
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
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Check transaction status
    const checkTransactionStatus = useCallback(async (hash: string) => {
        try {
            const response = await apiClient.getTransactionByHash(hash);

            if (response.success && response.data) {
                // Update transaction status in local history
                setTransactions(prev =>
                    prev.map(tx =>
                        tx.hash === hash
                            ? {
                                ...tx,
                                status: response.data!.transaction.status === 'confirmed' ? 'success' : response.data!.transaction.status as 'pending' | 'failed'
                            }
                            : tx
                    )
                );

                return response.data.transaction;
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

    // Retry a failed transaction (placeholder - backend doesn't support retry yet)
    const retryTransaction = useCallback(async (_transactionId: string): Promise<TransactionResult | null> => {
        toast({
            title: 'Feature Not Available',
            description: 'Transaction retry is not implemented yet.',
            variant: 'warning'
        });
        return null;
    }, [toast]);

    // Fetch transaction history from backend
    const fetchTransactionHistory = useCallback(async (
        token: string,
        limit?: number
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.getTransactionHistory(token, limit);

            if (response.success && response.data) {
                const backendTransactions: TransactionHistoryItem[] = response.data.transactions.map((tx: TransactionHistory) => ({
                    hash: tx.hash,
                    userOpHash: tx.userOpHash,
                    to: tx.to,
                    value: tx.value,
                    data: tx.data,
                    status: tx.status === 'confirmed' ? 'success' : tx.status,
                    timestamp: new Date(tx.createdAt).getTime(),
                }));

                setTransactions(backendTransactions);
                return backendTransactions;
            } else {
                throw new Error(response.error?.message || 'Failed to fetch transaction history');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction history';
            setError(errorMessage);
            console.error('Error fetching transaction history:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Clear transaction history
    const clearHistory = useCallback(() => {
        setTransactions([]);
        setError(null);
        setGasEstimate(null);
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
        isEstimating,
        error,
        gasEstimate,

        // Actions
        estimateGas,
        sendTransaction,
        retryTransaction,
        checkTransactionStatus,
        refreshPendingTransactions,
        fetchTransactionHistory,
        clearHistory,

        // Getters
        getTransaction,
        getTransactionsByStatus,

        // Computed values
        pendingTransactions: transactions.filter(tx => tx.status === 'pending'),
        successfulTransactions: transactions.filter(tx => tx.status === 'success'),
        failedTransactions: transactions.filter(tx => tx.status === 'failed'),
        totalTransactions: transactions.length,
        hasFailedTransactions: transactions.some(tx => tx.status === 'failed'),
        hasPendingTransactions: transactions.some(tx => tx.status === 'pending'),
    };
}
