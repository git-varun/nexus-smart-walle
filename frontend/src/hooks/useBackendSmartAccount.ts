import {useState, useEffect} from 'react';
import {Address} from 'viem';
import {apiClient} from '../services/apiClient';

interface User {
    email?: string;
    userId?: string;
}

interface SmartAccountInfo {
    address: Address;
    isDeployed: boolean;
    nonce: bigint;
    balance?: bigint;
}

export function useBackendSmartAccount() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [accountInfo, setAccountInfo] = useState<SmartAccountInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAuthStatus();

            if (response.success) {
                const data = response.data as { isAuthenticated: boolean; user: User | null };
                setIsAuthenticated(data.isAuthenticated);
                setUser(data.user);

                if (data.isAuthenticated && data.user) {
                    await loadAccountInfo();
                }
            }
        } catch (err) {
            console.error('Failed to check auth status:', err);
            setError(err instanceof Error ? err.message : 'Failed to check authentication');
        } finally {
            setLoading(false);
        }
    };

    const loadAccountInfo = async () => {
        try {
            // First get the account address, then fetch account info
            const createResponse = await apiClient.createSmartAccount();
            if (createResponse.success) {
                const createData = createResponse.data as { address: string };
                if (createData.address) {
                    const infoResponse = await apiClient.getAccountInfo(createData.address as any);
                    if (infoResponse.success) {
                        setAccountInfo(infoResponse.data as SmartAccountInfo);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load account info:', err);
        }
    };

    const connect = async (email: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.connectWallet(email);

            if (response.success) {
                console.log('✅ Email authentication successful:', response.data);
                setIsAuthenticated(true);
                setUser(response.data as User);
                await loadAccountInfo();
                console.log('✅ Account info loaded, isAuthenticated should now be true');
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Connection failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Connection failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        try {
            setLoading(true);
            await apiClient.disconnectWallet();

            setIsAuthenticated(false);
            setUser(null);
            setAccountInfo(null);
            setError(null);
        } catch (err) {
            console.error('Failed to disconnect:', err);
            setError(err instanceof Error ? err.message : 'Disconnect failed');
        } finally {
            setLoading(false);
        }
    };

    const sendTransaction = async (to: Address, data?: string, value?: bigint) => {
        try {
            if (!isAuthenticated) {
                throw new Error('Not authenticated');
            }

            const response = await apiClient.sendTransaction(to, data, value);

            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            console.error('Transaction failed:', err);
            throw err;
        }
    };

    return {
        // State
        isAuthenticated,
        user,
        accountInfo,
        loading,
        error,

        // Actions
        connect,
        disconnect,
        sendTransaction,
        checkAuthStatus,

        // Computed values
        smartAccountAddress: accountInfo?.address || null,
        balance: accountInfo?.balance || BigInt(0),

        // Compatibility properties for existing components
        isConnected: isAuthenticated,
        isChainSupported: true,
        chainId: 84532,
        isCreatingAccount: loading,
        creationProgress: null,
        createSmartAccount: () => Promise.resolve(),
        tokenBalances: [],
        nonce: accountInfo?.nonce || BigInt(0),
        isDeployed: accountInfo?.isDeployed || false,
        paymasterDeposit: '0',
        isLoading: loading,
        refreshData: checkAuthStatus,
        getSystemHealth: () => Promise.resolve({overall: 'healthy' as const}),
        alchemyService: null
    };
}
