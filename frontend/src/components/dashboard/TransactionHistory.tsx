import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {useTransactionHistoryBackend} from '../../hooks/useTransactionHistoryBackend';
import {formatEther} from 'viem';

interface TransactionHistoryProps {
    limit?: number;
    showHeader?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
                                                                          limit,
                                                                          showHeader = true
                                                                      }) => {
    const {token} = useBackendSmartAccount();
    const {
        transactions,
        isLoading,
        fetchTransactionHistory,
        clearHistory,
        retryTransaction,
        hasFailedTransactions,
        failedTransactions
    } = useTransactionHistoryBackend();

    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        // Auto-load transaction history when component mounts
        if (token && transactions.length === 0) {
            loadHistory();
        }
    }, [token]);

    const loadHistory = async () => {
        if (!token) return;

        setIsLoadingHistory(true);
        try {
            await fetchTransactionHistory(token, limit || 20);
        } catch (error) {
            console.error('Failed to load transaction history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleRetryTransaction = async (hash: string) => {
        try {
            await retryTransaction(hash);
        } catch (error) {
            console.error('Failed to retry transaction:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
            case 'confirmed':
                return (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="5 13l4 4L19 7"/>
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12"/>
                    </svg>
                );
            case 'pending':
            default:
                return (
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                );
        }
    };

    const formatValue = (value: string): string => {
        try {
            const ethValue = formatEther(BigInt(value));
            const numValue = parseFloat(ethValue);
            if (numValue === 0) return '0 ETH';
            if (numValue < 0.0001) return '<0.0001 ETH';
            return `${numValue.toFixed(4)} ETH`;
        } catch {
            return '0 ETH';
        }
    };

    const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
        >
            <Card className="p-6">
                {showHeader && (
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Recent transactions and their status
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {hasFailedTransactions && failedTransactions.length > 0 && (
                                <div
                                    className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    <span>{failedTransactions.length} failed</span>
                                </div>
                            )}
                            {transactions.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearHistory}
                                >
                                    Clear History
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadHistory}
                                loading={isLoadingHistory}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {(isLoading || isLoadingHistory) && transactions.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 border-2 border-web3-primary border-t-transparent rounded-full animate-spin"/>
                            <span className="text-muted-foreground">Loading transaction history...</span>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isLoadingHistory && transactions.length === 0 && (
                    <div className="text-center py-12">
                        <div
                            className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Transactions Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Your transaction history will appear here after you send your first transaction.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadHistory}
                            loading={isLoadingHistory}
                        >
                            Check for Transactions
                        </Button>
                    </div>
                )}

                {/* Transaction List */}
                {displayedTransactions.length > 0 && (
                    <div className="space-y-4">
                        {displayedTransactions.map((tx, index) => (
                            <motion.div
                                key={tx.hash}
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: index * 0.05}}
                                className="p-4 bg-slate-50 border rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        {/* Transaction Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(tx.status)}
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                                                    {tx.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                                            </div>
                                        </div>

                                        {/* Transaction Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">To:</span>
                                                <div className="font-mono text-xs break-all">
                                                    {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Value:</span>
                                                <div className="font-semibold">
                                                    {formatValue(tx.value)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Time:</span>
                                                <div>
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* UserOp Hash if available */}
                                        {tx.userOpHash && (
                                            <div className="mt-2 text-xs">
                                                <span className="text-muted-foreground">UserOp:</span>
                                                <span className="font-mono ml-2">
                                                    {tx.userOpHash.slice(0, 10)}...{tx.userOpHash.slice(-8)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        {tx.hash && (
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                                            >
                                                View on Explorer →
                                            </a>
                                        )}
                                        {tx.status === 'failed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRetryTransaction(tx.hash)}
                                                disabled={isLoading}
                                                className="text-xs"
                                            >
                                                Retry
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Show More Button */}
                        {!limit && transactions.length > displayedTransactions.length && (
                            <div className="text-center pt-4">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Showing {displayedTransactions.length} of {transactions.length} transactions
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadHistory()}
                                    loading={isLoadingHistory}
                                >
                                    Load More Transactions
                                </Button>
                            </div>
                        )}

                        {/* Gas Sponsorship Info */}
                        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span className="text-sm font-medium">Gas Sponsorship Active</span>
                            </div>
                            <p className="text-blue-700 text-xs mt-1">
                                All transaction fees are sponsored by Alchemy paymaster. You don't pay gas fees!
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};