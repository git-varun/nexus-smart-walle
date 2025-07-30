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
    email: string;
    userId: string;
}

interface SmartAccountInfo {
    address: Address;
    isDeployed: boolean;
    nonce: bigint;
    balance?: bigint;
}

interface TransactionRequest {
    to: Address;
    data?: string;
    value?: string; // Will be converted from bigint
}

interface TransactionResult {
    hash: string;
    userOpHash?: string;
    success: boolean;
    receipt?: any;
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
        // Use environment variable or default to localhost
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
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

    // Authentication API
    async getAuthStatus(): Promise<ApiResponse<{ isAuthenticated: boolean; user: User | null }>> {
        return this.request<{ isAuthenticated: boolean; user: User | null }>('/api/auth/status');
    }

    async connectWallet(email: string): Promise<ApiResponse<User>> {
        return this.request<User>('/api/auth/connect', {
            method: 'POST',
            body: JSON.stringify({email, type: 'email'} as AuthConnectRequest),
        });
    }

    async disconnectWallet(): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>('/api/auth/disconnect', {
            method: 'POST',
        });
    }

    // Account API
    async createSmartAccount(): Promise<ApiResponse<{ address: Address }>> {
        return this.request<{ address: Address }>('/api/accounts/create', {
            method: 'POST',
        });
    }

    async getAccountInfo(address: Address): Promise<ApiResponse<SmartAccountInfo>> {
        return this.request<SmartAccountInfo>(`/api/accounts/${address}`);
    }

    // Transaction API
    async sendTransaction(
        to: Address,
        data?: string,
        value?: bigint
    ): Promise<ApiResponse<TransactionResult>> {
        const payload: TransactionRequest = {
            to,
            data: data || '0x',
            value: value ? value.toString() : '0',
        };

        return this.request<TransactionResult>('/api/transactions/send', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getTransactionStatus(hash: string): Promise<ApiResponse<{
        hash: string;
        status: 'pending' | 'success' | 'failed';
        receipt?: any;
    }>> {
        return this.request(`/api/transactions/${hash}`);
    }

    // Session Key API
    async createSessionKey(
        permissions: SessionPermission[],
        expiresAt?: number
    ): Promise<ApiResponse<SessionKey>> {
        const payload = {
            permissions,
            expiresAt: expiresAt || Date.now() + 24 * 60 * 60 * 1000, // 24 hours default
        };

        return this.request<SessionKey>('/api/session/create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getSessionKeys(): Promise<ApiResponse<SessionKey[]>> {
        return this.request<SessionKey[]>('/api/session/list');
    }

    async revokeSessionKey(sessionId: string): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(`/api/session/${sessionId}`, {
            method: 'DELETE',
        });
    }

    // Recovery API
    async initiateRecovery(
        accountAddress: Address,
        guardians: Address[],
        threshold: number
    ): Promise<ApiResponse<RecoveryRequest>> {
        const payload = {
            accountAddress,
            guardians,
            threshold,
        };

        return this.request<RecoveryRequest>('/api/recovery/initiate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async getRecoveryStatus(recoveryId: string): Promise<ApiResponse<RecoveryRequest>> {
        return this.request<RecoveryRequest>(`/api/recovery/${recoveryId}/status`);
    }

    // Health check
    async getHealthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
        return this.request<{ status: string; timestamp: string }>('/health');
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
    SessionPermission,
    SessionKey,
    RecoveryRequest,
};
