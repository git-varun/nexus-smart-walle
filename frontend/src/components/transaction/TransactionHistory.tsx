// frontend/src/components/transaction/TransactionHistory.tsx
import React from 'react';
import { formatEther } from 'viem';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const TransactionHistory: React.FC = () => {
  const { transactions, isLoading, refreshHistory } = useTransactionHistory();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '🔄';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Transaction History</h2>
        <Button onClick={refreshHistory} variant="outline" size="sm" loading={isLoading}>
          Refresh
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No transactions yet</p>
          <p className="text-sm text-slate-500 mt-2">
            Your gasless transactions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div key={index} className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(tx.status)}</span>
                  <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(tx.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">To: </span>
                  <span className="text-slate-300 font-mono">
                    {tx.target.slice(0, 6)}...{tx.target.slice(-4)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400">Value: </span>
                  <span className="text-slate-300">
                    {formatEther(BigInt(tx.value))} ETH
                  </span>
                </div>

                {tx.gasUsed && (
                  <div>
                    <span className="text-slate-400">Gas: </span>
                    <span className="text-slate-300">{tx.gasUsed}</span>
                  </div>
                )}
              </div>

              {tx.userOpHash && (
                <div className="mt-2 text-xs">
                  <span className="text-slate-400">UserOp: </span>
                  <span className="text-slate-300 font-mono">
                    {tx.userOpHash.slice(0, 10)}...{tx.userOpHash.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
