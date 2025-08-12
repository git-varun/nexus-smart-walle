// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import {WalletTypeSelector} from '../wallet/WalletTypeSelector';
import {WalletDashboard} from '../wallet/WalletDashboard';
import {HealthStatusIcon} from '../health/HealthStatusIcon';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';
import {useAccount} from 'wagmi';
import {useHealthMonitor} from '../../hooks/useHealthMonitor';

export const MainLayout: React.FC = () => {
    const {isAuthenticated, smartAccountAddress} = useBackendSmartAccount();
    const {isConnected} = useAccount();
    const {health, refresh} = useHealthMonitor();

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

            {/* Health Status Icon */}
            <HealthStatusIcon health={health} onRefresh={refresh}/>
        </div>
    );
};
