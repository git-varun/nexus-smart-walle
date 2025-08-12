import {useCallback, useEffect, useState} from 'react';
import {Address} from 'viem';
import {apiClient, SmartAccountInfo, User} from '../services/apiClient';

// Token management
const TOKEN_KEY = 'nexus_auth_token';

const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

const removeStoredToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

export function useBackendSmartAccount() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [accountInfo, setAccountInfo] = useState<SmartAccountInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // First check if we have a stored token
            const storedToken = getStoredToken();
            if (!storedToken) {
                setIsAuthenticated(false);
                setUser(null);
                setAccountInfo(null);
                setToken(null);
                return;
            }

            setToken(storedToken);

            // Verify token with backend
            const response = await apiClient.getAuthStatus(storedToken);

            if (response.success && response.data) {
                const {authenticated, user: userData} = response.data;

                if (authenticated && userData) {
                    setIsAuthenticated(true);
                    setUser(userData);
                    await loadAccountInfo(storedToken);
                } else {
                    // Token is invalid, clear it
                    await handleLogout();
                }
            } else {
                await handleLogout();
            }
        } catch (err) {
            console.error('Failed to check auth status:', err);
            setError(err instanceof Error ? err.message : 'Failed to check authentication');
            await handleLogout();
        } finally {
            setLoading(false);
        }
    }, []);

    const loadAccountInfo = useCallback(async (authToken: string) => {
        try {
            // Get or create user's smart account
            const createResponse = await apiClient.createSmartAccount(authToken);
            if (createResponse.success && createResponse.data?.account) {
                setAccountInfo(createResponse.data.account);
            }
        } catch (err) {
            console.error('Failed to load account info:', err);
            setError(err instanceof Error ? err.message : 'Failed to load account info');
        }
    }, []);

    const connect = useCallback(async (email: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.authenticate(email);

            if (response.success && response.data) {
                const {user: userData, token: authToken, smartAccountAddress} = response.data;

                // Store token
                setStoredToken(authToken);
                setToken(authToken);

                // Update state
                setIsAuthenticated(true);
                setUser(userData);

                // Load account info
                await loadAccountInfo(authToken);

                console.log('✅ Authentication successful:', {user: userData, smartAccountAddress});
                return {user: userData, token: authToken, smartAccountAddress};
            } else {
                throw new Error(response.error?.message || 'Authentication failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [loadAccountInfo]);

    const handleLogout = useCallback(async () => {
        // Clear stored token
        removeStoredToken();

        // Clear state
        setIsAuthenticated(false);
        setUser(null);
        setAccountInfo(null);
        setToken(null);
        setError(null);
    }, []);

    const disconnect = useCallback(async () => {
        try {
            setLoading(true);

            const currentToken = token || getStoredToken();
            if (currentToken) {
                // Try to logout on backend (don't fail if it doesn't work)
                try {
                    await apiClient.logout(currentToken);
                } catch (err) {
                    console.warn('Backend logout failed:', err);
                }
            }

            await handleLogout();
        } catch (err) {
            console.error('Failed to disconnect:', err);
            setError(err instanceof Error ? err.message : 'Disconnect failed');
        } finally {
            setLoading(false);
        }
    }, [token, handleLogout]);

    const sendTransaction = useCallback(async (to: Address, data?: string, value?: bigint) => {
        try {
            if (!isAuthenticated || !token) {
                throw new Error('Not authenticated');
            }

            const response = await apiClient.sendTransaction(token, to, data, value);

            if (response.success && response.data) {
                return response.data.transaction;
            } else {
                throw new Error(response.error?.message || 'Transaction failed');
            }
        } catch (err) {
            console.error('Transaction failed:', err);
            throw err;
        }
    }, [isAuthenticated, token]);

    return {
        // State
        isAuthenticated,
        user,
        accountInfo,
        loading,
        error,
        token,

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
