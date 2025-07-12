// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import { WalletConnect } from '../wallet/WalletConnect';
import { WalletInfo } from '../wallet/WalletInfo';
import { TransactionInterface } from '../transaction/TransactionInterface';
import { SessionKeyManager } from '../session/SessionKeyManager';
import { useSmartAccount } from '../../hooks/useSmartAccount';

export const MainLayout: React.FC = () => {
  const { isConnected, smartAccountAddress } = useSmartAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Smart Wallet
              </h1>
              <p className="text-slate-400">
                ERC-4337 Account Abstraction with Gasless Transactions
              </p>
            </div>
            <WalletConnect />
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {isConnected && smartAccountAddress ? (
            <>
              {/* Wallet Information */}
              <WalletInfo />

              {/* Transaction Interface */}
              <TransactionInterface />

              {/* Session Key Management */}
              <SessionKeyManager />
            </>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Welcome to Smart Wallet
                </h2>
                <p className="text-slate-300 mb-6">
                  Connect your wallet to create a smart account and experience gasless transactions.
                </p>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center text-sm text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    ERC-4337 Account Abstraction
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Gasless Transactions via Paymaster
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Session Keys for Temporary Access
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
