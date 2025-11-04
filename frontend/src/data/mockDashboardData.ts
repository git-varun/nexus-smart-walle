// Mock data for enhanced dashboard statistics and visualizations

export interface ActivityDataPoint {
    date: string;
    transactions: number;
    volume: number;
}

export interface ChainData {
    chainId: number;
    name: string;
    color: string;
    percentage: number;
    transactions: number;
    volume: number;
}

export interface AccountData {
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

export interface ActivityItem {
    id: string;
    type: 'transaction' | 'account_created' | 'session_key' | 'deployment';
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: Date;
    description: string;
    details?: {
        hash?: string;
        amount?: string;
        from?: string;
        to?: string;
        chainId?: number;
        gasUsed?: string;
    };
}

export interface EnhancedStats {
    totalBalance: string;
    totalAccounts: number;
    totalTransactions: number;
    activeSessionKeys: number;
    successRate: number;
    gasSaved: string;
    monthlyGrowth: {
        transactions: number;
        volume: number;
        accounts: number;
    };
}

// Generate activity data for the last 30 days
export const generateActivityData = (): ActivityDataPoint[] => {
    const data: ActivityDataPoint[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate realistic transaction patterns
        const baseTransactions = Math.floor(Math.random() * 15) + 5;
        const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.6 : 1;
        const transactions = Math.floor(baseTransactions * weekendMultiplier);

        // Volume correlates with transaction count but with some variance
        const baseVolume = transactions * (Math.random() * 0.5 + 0.1);
        const volume = Math.round(baseVolume * 100) / 100;

        data.push({
            date: date.toISOString().split('T')[0],
            transactions,
            volume
        });
    }

    return data;
};

// Chain distribution data
export const mockChainData: ChainData[] = [
    {
        chainId: 84532,
        name: 'Base Sepolia',
        color: '#0052FF',
        percentage: 45.5,
        transactions: 156,
        volume: 12.4567
    },
    {
        chainId: 1,
        name: 'Ethereum',
        color: '#627EEA',
        percentage: 28.3,
        transactions: 97,
        volume: 8.9123
    },
    {
        chainId: 137,
        name: 'Polygon',
        color: '#8247E5',
        percentage: 15.2,
        transactions: 52,
        volume: 3.2456
    },
    {
        chainId: 42161,
        name: 'Arbitrum',
        color: '#28A0F0',
        percentage: 8.7,
        transactions: 30,
        volume: 2.1234
    },
    {
        chainId: 10,
        name: 'Optimism',
        color: '#FF0420',
        percentage: 2.3,
        transactions: 8,
        volume: 0.5678
    }
];

// Mock account data
export const mockAccountData: AccountData[] = [
    {
        id: 'acc_1',
        address: '0x742d35Cc8B34C0b7e6B2B7b7b7b7b7b7b7b7b7b7',
        chainId: 84532,
        chainName: 'Base Sepolia',
        balance: '12.4567',
        isDeployed: true,
        accountType: 'alchemy-light',
        transactionCount: 156,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nonce: 157,
        gasUsed: '0.02341',
        isActive: true
    },
    {
        id: 'acc_2',
        address: '0x8ba1f109551bD432803012645Hac136c22C57592',
        chainId: 1,
        chainName: 'Ethereum',
        balance: '8.9123',
        isDeployed: true,
        accountType: 'kernel-v3',
        transactionCount: 97,
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nonce: 98,
        gasUsed: '0.05678',
        isActive: false
    },
    {
        id: 'acc_3',
        address: '0x123d45Cc6B89C1b8e7B3B8b8b8b8b8b8b8b8b8b8',
        chainId: 137,
        chainName: 'Polygon',
        balance: '3.2456',
        isDeployed: false,
        accountType: 'biconomy',
        transactionCount: 0,
        lastActivity: undefined,
        nonce: 0,
        gasUsed: '0',
        isActive: false
    }
];

// Generate recent activity feed
export const generateActivityFeed = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Recent confirmed transaction
    activities.push({
        id: 'act_1',
        type: 'transaction',
        status: 'confirmed',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        description: 'Sent ETH to 0x8ba1...7592',
        details: {
            hash: '0xab123...def789',
            amount: '0.5',
            to: '0x8ba1f109551bD432803012645Hac136c22C57592',
            chainId: 84532,
            gasUsed: '21000'
        }
    });

    // Pending transaction
    activities.push({
        id: 'act_2',
        type: 'transaction',
        status: 'pending',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000),
        description: 'Contract interaction with Uniswap V3',
        details: {
            hash: '0xcd456...abc123',
            amount: '1.2',
            to: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            chainId: 1,
            gasUsed: '150000'
        }
    });

    // Account created
    activities.push({
        id: 'act_3',
        type: 'account_created',
        status: 'confirmed',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        description: 'Created new smart account on Polygon',
        details: {
            chainId: 137
        }
    });

    // Session key created
    activities.push({
        id: 'act_4',
        type: 'session_key',
        status: 'confirmed',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        description: 'Created session key for automated trading',
        details: {}
    });

    // Failed transaction
    activities.push({
        id: 'act_5',
        type: 'transaction',
        status: 'failed',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        description: 'Transaction failed: Insufficient gas',
        details: {
            hash: '0xef789...ghi012',
            amount: '2.5',
            to: '0x742d35Cc8B34C0b7e6B2B7b7b7b7b7b7b7b7b7b7',
            chainId: 1,
            gasUsed: '0'
        }
    });

    // Account deployment
    activities.push({
        id: 'act_6',
        type: 'deployment',
        status: 'confirmed',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        description: 'Smart account deployed on Base',
        details: {
            chainId: 84532,
            gasUsed: '250000'
        }
    });

    return activities;
};

// Enhanced statistics with trends
export const mockEnhancedStats: EnhancedStats = {
    totalBalance: '24.6146',
    totalAccounts: 3,
    totalTransactions: 253,
    activeSessionKeys: 2,
    successRate: 94.5,
    gasSaved: '0.4231',
    monthlyGrowth: {
        transactions: 23.5,
        volume: 18.7,
        accounts: 50.0
    }
};

// Sparkline data for stat cards (last 7 days)
export const mockSparklineData = {
    transactions: [12, 15, 8, 22, 18, 25, 19],
    volume: [1.2, 2.1, 0.8, 3.4, 2.7, 4.1, 2.9],
    accounts: [1, 1, 2, 2, 2, 3, 3],
    sessionKeys: [0, 1, 1, 1, 2, 2, 2]
};

// Provider performance data
export interface ProviderPerformance {
    name: string;
    type: 'bundler' | 'paymaster';
    successRate: number;
    avgLatency: number;
    gasOptimization: number;
    uptime: number;
    transactionCount: number;
}

export const mockProviderPerformance: ProviderPerformance[] = [
    {
        name: 'Alchemy',
        type: 'bundler',
        successRate: 99.2,
        avgLatency: 2.1,
        gasOptimization: 15.3,
        uptime: 99.9,
        transactionCount: 156
    },
    {
        name: 'Pimlico',
        type: 'bundler',
        successRate: 98.7,
        avgLatency: 2.8,
        gasOptimization: 12.1,
        uptime: 99.5,
        transactionCount: 97
    },
    {
        name: 'Stackup',
        type: 'paymaster',
        successRate: 97.9,
        avgLatency: 1.9,
        gasOptimization: 18.7,
        uptime: 98.8,
        transactionCount: 180
    },
    {
        name: 'Biconomy',
        type: 'paymaster',
        successRate: 96.4,
        avgLatency: 3.2,
        gasOptimization: 14.2,
        uptime: 97.9,
        transactionCount: 73
    }
];

// Network health indicators
export interface NetworkHealth {
    chainId: number;
    name: string;
    status: 'healthy' | 'degraded' | 'outage';
    latency: number;
    gasPrice: string;
    blockTime: number;
    congestion: 'low' | 'medium' | 'high';
}

export const mockNetworkHealth: NetworkHealth[] = [
    {
        chainId: 84532,
        name: 'Base Sepolia',
        status: 'healthy',
        latency: 120,
        gasPrice: '0.001',
        blockTime: 2.1,
        congestion: 'low'
    },
    {
        chainId: 1,
        name: 'Ethereum',
        status: 'healthy',
        latency: 180,
        gasPrice: '25.5',
        blockTime: 12.2,
        congestion: 'medium'
    },
    {
        chainId: 137,
        name: 'Polygon',
        status: 'degraded',
        latency: 350,
        gasPrice: '32.1',
        blockTime: 2.8,
        congestion: 'high'
    },
    {
        chainId: 42161,
        name: 'Arbitrum',
        status: 'healthy',
        latency: 95,
        gasPrice: '0.1',
        blockTime: 0.25,
        congestion: 'low'
    },
    {
        chainId: 10,
        name: 'Optimism',
        status: 'healthy',
        latency: 110,
        gasPrice: '0.001',
        blockTime: 2.0,
        congestion: 'low'
    }
];