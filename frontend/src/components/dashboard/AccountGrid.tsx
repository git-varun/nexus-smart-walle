import React from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent, CardHeader} from '../ui/Card';
import {Button} from '../ui/Button';
import {ChainLogoMapper} from '../ui/ChainLogos';

interface AccountData {
    id: string;
    address: string;
    chainId: number;
    chainName: string;
    balance: string;
    isDeployed: boolean;
    accountType: string;
    transactionCount: number;
    lastActivity?: Date;
    nonce?: number;
    gasUsed?: string;
    isActive: boolean;
}

interface AccountGridProps {
    accounts: AccountData[];
    onSelectAccount: (accountId: string) => void;
    selectedAccountId?: string;
    className?: string;
}

export const AccountGrid: React.FC<AccountGridProps> = ({
                                                            accounts,
                                                            onSelectAccount,
                                                            selectedAccountId,
                                                            className
                                                        }) => {
    const getChainColor = (chainId: number) => {
        const colors: Record<number, string> = {
            1: '#627EEA', // Ethereum
            84532: '#0052FF', // Base Sepolia
            137: '#8247E5', // Polygon
            42161: '#28A0F0', // Arbitrum
            10: '#FF0420', // Optimism
            8453: '#0052FF', // Base Mainnet
        };
        return colors[chainId] || '#6B7280';
    };


    const formatBalance = (balance: string): string => {
        const num = parseFloat(balance);
        if (num === 0) return '0.0000';
        if (num < 0.0001) return '<0.0001';
        return num.toFixed(4);
    };

    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getAccountTypeDisplay = (type: string) => {
        const types: Record<string, { name: string; color: string }> = {
            'alchemy-light': {name: 'Alchemy Light', color: 'text-blue-400'},
            'alchemy-modular': {name: 'Alchemy Modular', color: 'text-purple-400'},
            'kernel-v2': {name: 'Kernel v2', color: 'text-green-400'},
            'kernel-v3': {name: 'Kernel v3', color: 'text-emerald-400'},
            'biconomy': {name: 'Biconomy', color: 'text-orange-400'},
            'safe': {name: 'Safe', color: 'text-teal-400'},
        };
        return types[type] || {name: type, color: 'text-gray-400'};
    };

    if (accounts.length === 0) {
        return (
            <div className={className}>
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-card/70 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Smart Accounts</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first smart account to get started with Web3 transactions
                    </p>
                    <Button variant="primary" glow>
                        Create Smart Account
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Smart Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                        {accounts.length} account{accounts.length > 1 ? 's' : ''} across {new Set(accounts.map(a => a.chainId)).size} network{new Set(accounts.map(a => a.chainId)).size > 1 ? 's' : ''}
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Account
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account, index) => {
                    const accountTypeInfo = getAccountTypeDisplay(account.accountType);
                    const isSelected = selectedAccountId === account.id;

                    return (
                        <motion.div
                            key={account.id}
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: index * 0.1}}
                            whileHover={{scale: 1.02}}
                            onClick={() => onSelectAccount(account.id)}
                        >
                            <Card
                                className={`cursor-pointer transition-all duration-200 ${
                                    isSelected
                                        ? 'ring-2 ring-web3-primary bg-web3-primary/5 border-web3-primary/30'
                                        : 'hover:border-web3-primary/20 hover:bg-card/70'
                                }`}
                                hover={!isSelected}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                                <ChainLogoMapper
                                                    chainId={account.chainId}
                                                    symbol={account.chainName || 'ETH'}
                                                    size={32}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-mono text-sm text-foreground">
                                                    {formatAddress(account.address)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {account.chainName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                account.isDeployed ? 'bg-green-500' : 'bg-yellow-500'
                                            }`}/>
                                            {account.isActive && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Balance */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Balance</span>
                                        <span className="font-semibold text-foreground">
                                            {formatBalance(account.balance)} ETH
                                        </span>
                                    </div>

                                    {/* Account Type */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Type</span>
                                        <span className={`text-sm font-medium ${accountTypeInfo.color}`}>
                                            {accountTypeInfo.name}
                                        </span>
                                    </div>

                                    {/* Transaction Count */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Transactions</span>
                                        <span className="text-sm font-medium text-foreground">
                                            {account.transactionCount}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        <div
                                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                account.isDeployed
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                account.isDeployed ? 'bg-green-500' : 'bg-yellow-500'
                                            }`}/>
                                            {account.isDeployed ? 'Deployed' : 'Pending'}
                                        </div>
                                    </div>

                                    {/* Last Activity */}
                                    {account.lastActivity && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Last Activity</span>
                                            <span className="text-xs text-muted-foreground">
                                                {account.lastActivity.toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Nonce */}
                                    {account.nonce !== undefined && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Nonce</span>
                                            <span className="text-sm font-mono text-foreground">
                                                {account.nonce}
                                            </span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle transaction action
                                            }}
                                        >
                                            Send
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle copy address
                                                navigator.clipboard.writeText(account.address);
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                            </svg>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.3}}
                className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-web3-primary">
                        {accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0).toFixed(4)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Balance (ETH)</p>
                </Card>

                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-web3-secondary">
                        {accounts.reduce((sum, acc) => sum + acc.transactionCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                </Card>

                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-web3-accent">
                        {accounts.filter(acc => acc.isDeployed).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Deployed Accounts</p>
                </Card>

                <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">
                        {new Set(accounts.map(acc => acc.chainId)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Networks</p>
                </Card>
            </motion.div>
        </div>
    );
};