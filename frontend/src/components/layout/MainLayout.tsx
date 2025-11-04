// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import {AuthenticationPage} from '@/components/auth';
import {Dashboard} from '../dashboard/Dashboard';
import {NetworkStatus} from '../NetworkStatus';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';

export const MainLayout: React.FC = () => {
    const {isAuthenticated, loading, loginWithCredentials} = useBackendSmartAccount();

    const handleAuthSuccess = async (userData: { user: any; token: string }) => {
        try {
            await loginWithCredentials(userData);
        } catch (error) {
            console.error('Failed to complete authentication:', error);
        }
    };

    // Show loading screen while checking authentication
    if (loading) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div
                        className="w-16 h-16 border-4 border-web3-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Loading Nexus Smart Wallet...</p>
                    <p className="text-sm text-slate-400 mt-2">Checking authentication status</p>
                </div>
            </div>
        );
    }

    // Show authentication page if not authenticated
    if (!isAuthenticated) {
        return <AuthenticationPage onAuthSuccess={handleAuthSuccess}/>;
    }

    // Show main dashboard if authenticated
    return (
        <>
            <Dashboard/>
            <NetworkStatus/>
        </>
    );
};
