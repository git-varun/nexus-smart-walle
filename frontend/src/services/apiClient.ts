import {Address} from 'viem';

// API Response types matching backend
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// Request/Response types
interface AuthConnectRequest {
    email: string;
    type: 'email';
}

interface User {
    id: string;
    email: string;
    createdAt: string;
    lastLogin?: string;
}

interface SmartAccountInfo {
    id: string;
    address: Address;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    createdAt: string;
    updatedAt: string;
}

interface TransactionRequest {
    to: Address;
    data?: string;
    value?: string; // Will be converted from bigint
}

interface TransactionResult {
    id: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: string;
    updatedAt: string;
}

interface TransactionHistory {
    id: string;
    hash: string;
    userOpHash?: string;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    createdAt: string;
    updatedAt: string;
}

interface GasEstimate {
    gasEstimate: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

interface SessionPermission {
    target: Address;
    allowedFunctions: string[];
    spendingLimit: string;
}

interface SessionKey {
    id: string;
    publicKey: string;
    permissions: SessionPermission[];
    expiresAt: string;
    isActive: boolean;
}

interface RecoveryRequest {
    id: string;
    accountAddress: Address;
    guardians: Address[];
    threshold: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        // Use environment variable or default to backend port 3000
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Try to parse error response
                try {
                    const errorData = await response.json();
                    return {
                        success: false,
                        error: errorData.error || {
                            code: 'HTTP_ERROR',
                            message: `HTTP ${response.status}: ${response.statusText}`
                        }
                    };
                } catch {
                    return {
                        success: false,
                        error: {
                            code: 'HTTP_ERROR',
                            message: `HTTP ${response.status}: ${response.statusText}`
                        }
                    };
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error instanceof Error ? error.message : 'Network request failed'
                }
            };
        }
    }

    // Authentication API - Updated to match backend routes
    async getAuthStatus(token?: string): Promise<ApiResponse<{ authenticated: boolean; user: User | null }>> {
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.request<{ authenticated: boolean; user: User | null }>('/api/auth/status', {
            headers,
        });
    }

    async authenticate(email: string): Promise<ApiResponse<{
        user: User;
        token: string;
        smartAccountAddress?: string
    }>> {
        return this.request<{ user: User; token: string; smartAccountAddress?: string }>('/api/auth/authenticate', {
            method: 'POST',
            body: JSON.stringify({email}),
        });
    }

    async logout(token?: string): Promise<ApiResponse<{ message: string }>> {
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return this.request<{ message: string }>('/api/auth/logout', {
            method: 'POST',
            headers,
        });
    }

    // Account API - Updated to match backend structure
    async createSmartAccount(token: string): Promise<ApiResponse<{ account: SmartAccountInfo }>> {
        return this.request<{ account: SmartAccountInfo }>('/api/accounts/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getAccountByAddress(address: Address): Promise<ApiResponse<{ account: SmartAccountInfo }>> {
        return this.request<{ account: SmartAccountInfo }>(`/api/accounts/${address}`);
    }

    async getUserAccounts(token: string): Promise<ApiResponse<{ accounts: SmartAccountInfo[] }>> {
        return this.request<{ accounts: SmartAccountInfo[] }>('/api/accounts/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    // Transaction API - Updated to match backend structure
    async sendTransaction(
        token: string,
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<ApiResponse<{ transaction: TransactionResult }>> {
        const payload: TransactionRequest = {
            to,
            data: data || '0x',
            value: value ? value.toString() : '0',
        };

        return this.request<{ transaction: TransactionResult }>('/api/transactions/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    }

    async getTransactionByHash(hash: string): Promise<ApiResponse<{ transaction: TransactionHistory }>> {
        return this.request<{ transaction: TransactionHistory }>(`/api/transactions/${hash}`);
    }

    async getTransactionHistory(token: string, limit?: number): Promise<ApiResponse<{
        transactions: TransactionHistory[];
        count: number
    }>> {
        const searchParams = new URLSearchParams();
        if (limit) searchParams.append('limit', limit.toString());

        const query = searchParams.toString();
        return this.request<{
            transactions: TransactionHistory[];
            count: number
        }>(`/api/transactions/history${query ? `?${query}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async estimateGas(
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<ApiResponse<{ gasEstimate: string; gasLimit: string; breakdown: any }>> {
        const payload: TransactionRequest = {
            to,
            data: data || '0x',
            value: value ? value.toString() : '0',
        };

        return this.request<{
            gasEstimate: string;
            gasLimit: string;
            breakdown: any
        }>('/api/transactions/estimate-gas', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // TODO: Session Key API - To be implemented in future versions
    // TODO: Recovery API - To be implemented in future versions

    // Health check - Updated to match backend route
    async getHealthCheck(): Promise<ApiResponse<{ healthy: boolean; timestamp: string; database: any; system: any }>> {
        return this.request<{ healthy: boolean; timestamp: string; database: any; system: any }>('/api/health');
    }

    // System stats
    async getSystemStats(): Promise<ApiResponse<{ users: any; accounts: any; transactions: any; sessions: any }>> {
        return this.request<{ users: any; accounts: any; transactions: any; sessions: any }>('/api/stats');
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Export types for use in components
export type {
    ApiResponse,
    User,
    SmartAccountInfo,
    TransactionResult,
    TransactionHistory,
    GasEstimate,
    SessionPermission,
    SessionKey,
    RecoveryRequest,
};
