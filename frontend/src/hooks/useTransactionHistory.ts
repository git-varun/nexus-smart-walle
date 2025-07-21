// frontend/src/hooks/useTransactionHistory.ts
import {useCallback, useEffect, useState} from 'react';
import {useSmartAccount} from './useSmartAccount';
import {Transaction} from '../types/transaction';
import {parseEther} from 'viem';

export const useTransactionHistory = () => {
    const {smartAccountAddress} = useSmartAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch transaction history
    const fetchHistory = useCallback(async () => {
        if (!smartAccountAddress) return;

        setIsLoading(true);
        try {
            // TODO: Implement real transaction history fetching
            // This would involve:
            // 1. Query bundler for UserOperations
            // 2. Get transaction receipts
            // 3. Parse transaction data

            // Mock data for now
            const mockTransactions: Transaction[] = [
                {
                    hash: '0x' + Math.random().toString(16).substring(2, 66),
                    userOpHash: '0x' + Math.random().toString(16).substring(2, 66),
                    status: 'success',
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    target: '0x' + Math.random().toString(16).substring(2, 42),
                    value: parseEther('0.1').toString(),
                    gasUsed: '45000',
                    method: 'transfer'
                },
                {
                    hash: '0x' + Math.random().toString(16).substring(2, 66),
                    userOpHash: '0x' + Math.random().toString(16).substring(2, 66),
                    status: 'pending',
                    timestamp: Date.now() - 300000, // 5 minutes ago
                    target: '0x' + Math.random().toString(16).substring(2, 42),
                    value: parseEther('0.05').toString(),
                    method: 'approve'
                }
            ];

            setTransactions(mockTransactions);
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [smartAccountAddress]);

    // Auto-fetch when smart account changes
    useEffect(() => {
        if (smartAccountAddress) {
            fetchHistory();

            // Set up polling for pending transactions
            const interval = setInterval(fetchHistory, 10000); // Poll every 10 seconds
            return () => clearInterval(interval);
        } else {
            setTransactions([]);
        }
    }, [smartAccountAddress, fetchHistory]);

    return {
        transactions,
        isLoading,
        refreshHistory: fetchHistory
    };
};
