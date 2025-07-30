// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import {WalletTypeSelector} from '../wallet/WalletTypeSelector';
import {WalletDashboard} from '../wallet/WalletDashboard';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {useAccount} from 'wagmi';

export const MainLayout: React.FC = () => {
    const {isAuthenticated, smartAccountAddress} = useBackendSmartAccount();
    const {isConnected} = useAccount();

    console.log('🏗️ MainLayout render:', {
        isAuthenticated,
        smartAccountAddress,
        isConnected,
        shouldShowDashboard: isAuthenticated || isConnected,
        shouldShowSelector: !isAuthenticated && !isConnected
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
                                Nexus Smart Wallet
                            </h1>
                            <p className="text-slate-400">
                                ERC-4337 Account Abstraction with Backend API Integration
                            </p>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="space-y-8">
                    {/* Debug Info */}
                    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
                        Email Auth: {isAuthenticated ? '✅' : '❌'} | MetaMask: {isConnected ? '✅' : '❌'}
                    </div>

                    {/* Show selector if no wallet is connected */}
                    {!isAuthenticated && !isConnected && (
                        <WalletTypeSelector/>
                    )}

                    {/* Show dashboard if any wallet is connected */}
                    {(isAuthenticated || isConnected) && (
                        <WalletDashboard/>
                    )}

                    {/* Fallback */}
                    {!isAuthenticated && !isConnected && (
                        <div className="text-center text-white">
                            <p>No wallet connected. Please choose a connection method above.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
