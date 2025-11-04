import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';
import {apiClient} from '@/services/apiClient.ts';
import {formatEther} from 'viem';
import {StatCard} from './StatCard';
import {AccountGrid} from './AccountGrid';
import {getChainById} from '@/config/chains';

interface AccountStats {
    totalAccounts: number;
    totalBalance: string;
    totalTransactions: number;
    activeSessionKeys: number;
}

export const AccountOverview: React.FC = () => {
    const {user, token, accountInfo, userAccounts, loading, currentChainId} = useBackendSmartAccount();
    const [stats, setStats] = useState<AccountStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>();

    useEffect(() => {
        const fetchStats = async () => {
            if (!token || loading) return;

            try {
                setIsLoadingStats(true);

                // Use centralized userAccounts data
                const totalAccounts = userAccounts.length;

                // Get transaction history for current chain
                const txResponse = await apiClient.getTransactionHistory(token, currentChainId);
                const totalTransactions = txResponse.success ? txResponse.data?.transactions.length || 0 : 0;

                // Calculate total balance (for now just use current account balance)
                const totalBalance = accountInfo?.balance || '0';

                // Session keys would come from session API when implemented
                const activeSessionKeys = 0;

                setStats({
                    totalAccounts,
                    totalBalance,
                    totalTransactions,
                    activeSessionKeys
                });
            } catch (error) {
                console.error('Failed to fetch account stats:', error);
                setStats({
                    totalAccounts: 0,
                    totalBalance: '0',
                    totalTransactions: 0,
                    activeSessionKeys: 0
                });
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [token, accountInfo, userAccounts, loading, currentChainId]);

    const formatBalance = (balance: string): string => {
        try {
            const ethBalance = formatEther(BigInt(balance));
            return parseFloat(ethBalance).toFixed(4);
        } catch {
            return '0.0000';
        }
    };

    if (loading || isLoadingStats) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground">Account Overview</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                                <div className="h-8 bg-slate-200 rounded"></div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const gridAccounts = userAccounts.map(acc => {
        const chain = getChainById(acc.chainId);
        return {
            id: acc.id,
            address: acc.address,
            chainId: acc.chainId,
            chainName: chain?.displayName || String(acc.chainId),
            balance: acc.balance || '0',
            isDeployed: acc.isDeployed,
            accountType: 'kernel-v3',
            transactionCount: 0,
            lastActivity: acc.updatedAt ? new Date(acc.updatedAt) : undefined,
            nonce: acc.nonce,
            gasUsed: undefined,
            isActive: !!acc.isDeployed,
        };
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Welcome
                        back{user?.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
                    <p className="text-muted-foreground mt-1">
                        Here's your comprehensive smart wallet dashboard
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Export Data
                    </Button>
                    <Button variant="primary" glow>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                        New Transaction
                    </Button>
                </div>
            </motion.div>

            {/* Enhanced Stats Cards */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* Total Balance */}
                <StatCard
                    title="Total Balance"
                    value={`${formatBalance(stats?.totalBalance || '0')} ETH`}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                    }
                    color="primary"
                    subtitle="Across current network"
                />

                {/* Smart Accounts */}
                <StatCard
                    title="Smart Accounts"
                    value={stats?.totalAccounts || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    }
                    color="secondary"
                    subtitle={`${userAccounts.filter(acc => acc.isDeployed).length} deployed`}
                />

                {/* Transactions */}
                <StatCard
                    title="Transactions"
                    value={stats?.totalTransactions || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                    }
                    color="accent"
                />

                {/* Session Keys */}
                <StatCard
                    title="Session Keys"
                    value={stats?.activeSessionKeys || 0}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                        </svg>
                    }
                    color="warning"
                />
            </motion.div>


            {/* Smart Accounts Overview */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.3}}
            >
                <AccountGrid
                    accounts={gridAccounts}
                    onSelectAccount={setSelectedAccountId}
                    selectedAccountId={selectedAccountId}
                />
            </motion.div>

        </div>
    );
};