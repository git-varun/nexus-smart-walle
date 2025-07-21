// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import {WalletConnect} from '../wallet/WalletConnect';
import {WalletInfo} from '../wallet/WalletInfo';
import {TransactionInterface} from '../transaction/TransactionInterface';
import {TransactionHistory} from '../transaction/TransactionHistory';
import {SessionKeyManager} from '../session/SessionKeyManager';
import {RecoveryPanel} from '../recovery/RecoveryPanel';
import {ModuleStore} from '../modules/ModuleStore';
import {AnalyticsDashboard} from '../analytics/analyticsDashboard';
import {useSmartAccount} from '@/hooks/useSmartAccount.ts';

export const MainLayout: React.FC = () => {
    const {isConnected, smartAccountAddress} = useSmartAccount();

    console.log('🏗️ MainLayout render:', {
        isConnected,
        smartAccountAddress,
        shouldShowComponents: isConnected && smartAccountAddress
    });

    // Watch for smartAccountAddress changes
    React.useEffect(() => {
        console.log('🔄 MainLayout: smartAccountAddress changed to:', smartAccountAddress);
        if (smartAccountAddress) {
            console.log('✅ MainLayout: Smart account detected, components should now be visible');
        } else {
            console.log('❌ MainLayout: No smart account, components hidden');
        }
    }, [smartAccountAddress]);

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
                        <WalletConnect/>
                    </div>
                </header>

                {/* Main Content */}
                <main className="space-y-8">
                    {isConnected ? (
                        <>
                            {/* Wallet Information */}
                            <WalletInfo/>

                            {/* Transaction Interface - only show if smart account exists */}
                            {smartAccountAddress && <TransactionInterface/>}

                            {/* Transaction History - only show if smart account exists */}
                            {smartAccountAddress && <TransactionHistory/>}

                            {/* Session Key Management - only show if smart account exists */}
                            {smartAccountAddress && <SessionKeyManager/>}

                            {/* Recovery Panel - only show if smart account exists */}
                            {smartAccountAddress && <RecoveryPanel/>}

                            {/* Module Store - only show if smart account exists */}
                            {smartAccountAddress && <ModuleStore/>}

                            {/* Analytics Dashboard - only show if smart account exists */}
                            {smartAccountAddress && <AnalyticsDashboard/>}

                            {/* Debug: Show what we're getting */}
                            {!smartAccountAddress && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                                    <h3 className="font-medium mb-2">🔍 Debug Info</h3>
                                    <p className="text-sm">No smart account address detected in MainLayout.</p>
                                    <p className="text-sm">Connect your wallet and create a smart account to see
                                        available features.</p>
                                </div>
                            )}
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
