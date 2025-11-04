import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Address} from 'viem';
import {apiClient, GasEstimate, TransactionHistory, TransactionResult} from '../services/apiClient';
import {useToast} from './useToast';
import {useBackendSmartAccount} from './useBackendSmartAccount';

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
    const {token, currentChainId} = useBackendSmartAccount();
    const transactionsRef = useRef<TransactionHistoryItem[]>([]);

    // Keep ref in sync with state
    useEffect(() => {
        transactionsRef.current = transactions;
    }, [transactions]);

    // Estimate gas for a transaction
    const estimateGas = useCallback(async (
        to: Address,
        data?: string,
        value?: bigint,
        bundler: string = 'alchemy' // Default bundler
    ): Promise<GasEstimate | null> => {
        try {
            setIsEstimating(true);
            setError(null);

            if (!token) {
                throw new Error('Authentication token not available');
            }

            const response = await apiClient.estimateGas(token, currentChainId, bundler, to, data, value);

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
    }, [token, currentChainId, toast]);

    // Send a new transaction
    const sendTransaction = useCallback(async (
        token: string,
        to: Address,
        data?: string,
        value?: bigint,
        providers?: { bundler: string; paymaster: string; chainId: number }
    ): Promise<TransactionResult> => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.sendTransaction(token, to, data, value, providers);

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
        const pendingTxs = transactionsRef.current.filter(tx => tx.status === 'pending');

        for (const tx of pendingTxs) {
            await checkTransactionStatus(tx.hash);
        }
    }, [checkTransactionStatus]);

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
        chainId?: number,
        limit?: number
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await apiClient.getTransactionHistory(token, chainId, limit);

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

    // Memoize pending transactions count to avoid unnecessary effect runs
    const pendingTransactionsCount = useMemo(() => {
        return transactions.filter(tx => tx.status === 'pending').length;
    }, [transactions]);

    // Auto-refresh pending transactions periodically
    useEffect(() => {
        if (pendingTransactionsCount > 0) {
            const interval = setInterval(() => {
                refreshPendingTransactions();
            }, 10000); // Check every 10 seconds

            return () => clearInterval(interval);
        }
    }, [pendingTransactionsCount, refreshPendingTransactions]);

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

        // Computed values (memoized)
        pendingTransactions: useMemo(() => transactions.filter(tx => tx.status === 'pending'), [transactions]),
        successfulTransactions: useMemo(() => transactions.filter(tx => tx.status === 'success'), [transactions]),
        failedTransactions: useMemo(() => transactions.filter(tx => tx.status === 'failed'), [transactions]),
        totalTransactions: transactions.length,
        hasFailedTransactions: useMemo(() => transactions.some(tx => tx.status === 'failed'), [transactions]),
        hasPendingTransactions: useMemo(() => transactions.some(tx => tx.status === 'pending'), [transactions]),
    };
}
