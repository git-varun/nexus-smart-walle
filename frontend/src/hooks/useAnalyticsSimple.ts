import {useState} from 'react';

interface AnalyticsData {
    totalTransactions: number;
    totalGasSaved: string;
    totalSpent: string;
    recentActivity: Array<{
        date: string;
        transactions: number;
        gasSaved: string;
    }>;
    chartData: Array<{
        date: string;
        transactions: number;
        gasSaved: number;
    }>;
    // Additional properties expected by the component
    transactionGrowth: number;
    gasSaved: number;
    gasSavedUSD: number;
    activeSessions: number;
    totalSessions: number;
    successRate: number;
    failedTransactions: number;
    transactionHistory: any[];
    topInteractions: any[];
    transactionTypes: any[];
    successFailureData: any[];
    recentTransactions: any[];
    averageGasPerTx: string;
    paymasterCoverage: number;
    gasUsageHistory: any[];
    moduleUsage: any[];
    sessionKeyActivity: any[];
    modulePerformance: any[];
}

export const useAnalyticsSimple = () => {
    const [analytics] = useState<AnalyticsData>({
        totalTransactions: 0,
        totalGasSaved: '0 ETH',
        totalSpent: '0 ETH',
        recentActivity: [],
        chartData: [],
        transactionGrowth: 0,
        gasSaved: 0,
        gasSavedUSD: 0,
        activeSessions: 0,
        totalSessions: 0,
        successRate: 100,
        failedTransactions: 0,
        transactionHistory: [],
        topInteractions: [],
        transactionTypes: [],
        successFailureData: [],
        recentTransactions: [],
        averageGasPerTx: '0',
        paymasterCoverage: 0,
        gasUsageHistory: [],
        moduleUsage: [],
        sessionKeyActivity: [],
        modulePerformance: []
    });

    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const refreshAnalytics = async () => {
        console.log('Analytics refresh not implemented in backend yet');
    };

    return {
        analytics,
        isLoading,
        error,
        refreshAnalytics,
        timeRange: '7d',
        setTimeRange: (range: string) => console.log('Time range not implemented:', range)
    };
};
