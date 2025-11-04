import React, {useEffect, useState} from 'react';
import {DashboardLayout} from './DashboardLayout';
import {AccountOverview} from './AccountOverview';
import {AccountCreation} from './AccountCreation';
import {TransactionInterface} from './TransactionInterface';
import {SessionKeyManager} from '../session/SessionKeyManager';
import {UserProfile} from './UserProfile';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';

type DashboardSection = 'overview' | 'accounts' | 'transactions' | 'sessions' | 'profile';

export const Dashboard: React.FC = () => {
    const [currentSection, setCurrentSection] = useState<DashboardSection>('overview');
    const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

    const {user, token, accountInfo, userAccounts, loadUserAccounts, loading: authLoading} = useBackendSmartAccount();

    // Check if user has existing accounts when userAccounts is loaded
    useEffect(() => {
        if (authLoading) return; // Wait for auth to finish loading

        const userHasAccounts = userAccounts && userAccounts.length > 0;
        setHasAccounts(userHasAccounts);
        setIsLoadingAccounts(false);

        // If no accounts exist, redirect to account creation
        if (!userHasAccounts) {
            setCurrentSection('accounts');
        }
    }, [userAccounts, authLoading]);

    // Show loading state while checking accounts
    if (isLoadingAccounts) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div
                        className="w-16 h-16 border-4 border-web3-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg">Setting up your dashboard...</p>
                    <p className="text-sm text-slate-400 mt-2">Checking existing accounts</p>
                </div>
            </div>
        );
    }

    const handleAccountCreated = async () => {
        // Refresh account data from backend
        if (token) {
            await loadUserAccounts(token);
        }
        setHasAccounts(true);
        setCurrentSection('overview');
    };

    const renderContent = () => {
        // If no accounts exist, always show account creation
        if (hasAccounts === false) {
            return (
                <AccountCreation
                    onAccountCreated={handleAccountCreated}
                />
            );
        }

        // Otherwise, show the selected section
        switch (currentSection) {
            case 'overview':
                return <AccountOverview/>;
            case 'accounts':
                return (
                    <AccountCreation
                        onAccountCreated={handleAccountCreated}
                        showExisting={true}
                    />
                );
            case 'transactions':
                return <TransactionInterface/>;
            case 'sessions':
                return <SessionKeyManager/>;
            case 'profile':
                return <UserProfile/>;
            default:
                return <AccountOverview/>;
        }
    };

    return (
        <DashboardLayout
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
        >
            {renderContent()}
        </DashboardLayout>
    );
};