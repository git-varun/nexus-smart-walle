import {
    ServiceResponse,
    User,
    SmartAccountInfo,
    TransactionResult
} from '../../src/providers/alchemy/SimpleAlchemyClient';

/**
 * Mock data for Alchemy client responses
 */
export const mockUser: User = {
    email: 'test@nexuswallet.com',
    userId: 'user_1234567890'
};

export const mockSmartAccountInfo: SmartAccountInfo = {
    address: '0x74657374406e6578757377616c6c65742e636f6d' as any,
    isDeployed: true,
    nonce: BigInt(0),
    balance: BigInt('1000000000000000000')
};

export const mockTransactionResult: TransactionResult = {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as any,
    userOpHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as any,
    success: true,
    receipt: {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'success'
    }
};

/**
 * Mock implementation of SimpleAlchemyClient
 */
export class MockSimpleAlchemyClient {
    private authenticated: boolean = false;
    private currentUser: User | null = null;
    private smartAccountAddress: string | null = null;

    async authenticate(params: any): Promise<ServiceResponse<User>> {
        if (params.type === 'email' && params.email) {
            this.currentUser = {...mockUser, email: params.email};
            this.authenticated = true;
            this.smartAccountAddress = '0x74657374406e6578757377616c6c65742e636f6d';

            return {
                data: this.currentUser,
                success: true,
                metadata: {
                    service: 'mock-alchemy-client',
                    timestamp: Date.now()
                }
            };
        }

        return {
            data: null as any,
            success: false,
            error: {
                code: 'AUTH_FAILED',
                message: 'Invalid authentication parameters'
            }
        };
    }

    async logout(): Promise<ServiceResponse<void>> {
        this.authenticated = false;
        this.currentUser = null;
        this.smartAccountAddress = null;

        return {
            data: undefined,
            success: true,
            metadata: {
                service: 'mock-alchemy-client',
                timestamp: Date.now()
            }
        };
    }

    async getSmartAccountAddress(): Promise<ServiceResponse<string>> {
        if (!this.smartAccountAddress) {
            return {
                data: null as any,
                success: false,
                error: {
                    code: 'ADDRESS_NOT_AVAILABLE',
                    message: 'Smart account address not available'
                }
            };
        }

        return {
            data: this.smartAccountAddress,
            success: true,
            metadata: {
                service: 'mock-alchemy-client',
                timestamp: Date.now()
            }
        };
    }

    async getAccountInfo(): Promise<ServiceResponse<SmartAccountInfo>> {
        if (!this.smartAccountAddress) {
            return {
                data: null as any,
                success: false,
                error: {
                    code: 'ACCOUNT_NOT_AVAILABLE',
                    message: 'Account not available'
                }
            };
        }

        return {
            data: mockSmartAccountInfo,
            success: true,
            metadata: {
                service: 'mock-alchemy-client',
                timestamp: Date.now()
            }
        };
    }

    async sendTransaction(request: any): Promise<ServiceResponse<TransactionResult>> {
        if (!this.authenticated) {
            return {
                data: null as any,
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'User not authenticated'
                }
            };
        }

        const hash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        const result: TransactionResult = {
            ...mockTransactionResult,
            hash: hash as any,
            userOpHash: hash as any,
            receipt: {
                hash,
                status: 'success'
            }
        };

        return {
            data: result,
            success: true,
            metadata: {
                service: 'mock-alchemy-client',
                timestamp: Date.now()
            }
        };
    }

    async healthCheck(): Promise<ServiceResponse<{ isHealthy: boolean; lastChecked: number; latency: number }>> {
        return {
            data: {
                isHealthy: true,
                lastChecked: Date.now(),
                latency: 50
            },
            success: true,
            metadata: {
                service: 'mock-alchemy-client',
                timestamp: Date.now()
            }
        };
    }

    isAuthenticated(): boolean {
        return this.authenticated;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    getSignerStatus(): string {
        return this.authenticated ? 'connected' : 'disconnected';
    }

    isInitialized(): boolean {
        return true;
    }

    destroy(): void {
        this.authenticated = false;
        this.currentUser = null;
        this.smartAccountAddress = null;
    }

    getConfig(): any {
        return {
            apiKey: 'test_api_key',
            chainId: 84532
        };
    }

    getPublicClient(): any {
        return {
            getBalance: () => Promise.resolve(BigInt('1000000000000000000')),
            getBlockNumber: () => Promise.resolve(BigInt(12345))
        };
    }
}

// Mock the SimpleAlchemyClient module
jest.mock('../../src/providers/alchemy/SimpleAlchemyClient', () => ({
    SimpleAlchemyClient: MockSimpleAlchemyClient,
    AlchemySignerStatus: {
        INITIALIZING: 'initializing',
        CONNECTED: 'connected',
        DISCONNECTED: 'disconnected'
    }
}));
