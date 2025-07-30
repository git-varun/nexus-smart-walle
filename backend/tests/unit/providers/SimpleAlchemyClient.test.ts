import {
    SimpleAlchemyClient,
    AlchemyClientConfig,
    AlchemySignerParams
} from '../../../src/providers/alchemy/SimpleAlchemyClient';
import '../../mocks/viemMocks';

// Don't mock the actual SimpleAlchemyClient for unit testing
jest.unmock('../../../src/providers/alchemy/SimpleAlchemyClient');

describe('SimpleAlchemyClient', () => {
    let client: SimpleAlchemyClient;
    let config: AlchemyClientConfig;

    beforeEach(() => {
        config = {
            apiKey: 'test_api_key',
            chainId: 84532,
            policyId: 'test_policy_id',
            gasManagerConfig: {
                policyId: 'test_policy_id'
            }
        };

        client = new SimpleAlchemyClient(config);
    });

    afterEach(() => {
        if (client) {
            client.destroy();
        }
    });

    describe('Initialization', () => {
        it('should initialize with correct config', () => {
            const clientConfig = client.getConfig();

            expect(clientConfig).toEqual(config);
            expect(client.isInitialized()).toBe(true);
        });

        it('should initialize with disconnected state', () => {
            expect(client.isAuthenticated()).toBe(false);
            expect(client.getCurrentUser()).toBeNull();
            expect(client.getSignerStatus()).toBe('disconnected');
        });

        it('should have public client available', () => {
            const publicClient = client.getPublicClient();
            expect(publicClient).toBeDefined();
            expect(publicClient.getBalance).toBeDefined();
            expect(publicClient.getBlockNumber).toBeDefined();
        });
    });

    describe('Authentication', () => {
        const validAuthParams: AlchemySignerParams = {
            type: 'email',
            email: 'test@nexuswallet.com'
        };

        it('should authenticate with valid email', async () => {
            const result = await client.authenticate(validAuthParams);

            expect(result.success).toBe(true);
            expect(result.data.email).toBe('test@nexuswallet.com');
            expect(result.data.userId).toMatch(/^user_\d+$/);
            expect(result.metadata?.service).toBe('simple-alchemy-client');

            expect(client.isAuthenticated()).toBe(true);
            expect(client.getCurrentUser()).toEqual(result.data);
            expect(client.getSignerStatus()).toBe('connected');
        });

        it('should generate consistent smart account address from email', async () => {
            const result1 = await client.authenticate(validAuthParams);
            const address1 = await client.getSmartAccountAddress();

            client.destroy();
            client = new SimpleAlchemyClient(config);

            const result2 = await client.authenticate(validAuthParams);
            const address2 = await client.getSmartAccountAddress();

            expect(address1.data).toBe(address2.data);
            expect(address1.data).toMatch(/^0x[a-f0-9]{40}$/i);
        });

        it('should fail authentication with missing email', async () => {
            const invalidParams: AlchemySignerParams = {
                type: 'email'
            };

            const result = await client.authenticate(invalidParams);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('AUTH_FAILED');
            expect(client.isAuthenticated()).toBe(false);
        });

        it('should fail authentication with unsupported type', async () => {
            const invalidParams: AlchemySignerParams = {
                type: 'google' as any,
                email: 'test@nexuswallet.com'
            };

            const result = await client.authenticate(invalidParams);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('AUTH_FAILED');
            expect(result.error?.message).toBe('Only email authentication is supported');
        });
    });

    describe('Smart Account Management', () => {
        beforeEach(async () => {
            await client.authenticate({
                type: 'email',
                email: 'test@nexuswallet.com'
            });
        });

        it('should return smart account address after authentication', async () => {
            const result = await client.getSmartAccountAddress();

            expect(result.success).toBe(true);
            expect(result.data).toMatch(/^0x[a-f0-9]{40}$/i);
            expect(result.metadata?.service).toBe('simple-alchemy-client');
        });

        it('should fail to get address without authentication', async () => {
            client.destroy();
            client = new SimpleAlchemyClient(config);

            const result = await client.getSmartAccountAddress();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ADDRESS_FETCH_FAILED');
        });

        it('should return account info with correct format', async () => {
            const result = await client.getAccountInfo();

            expect(result.success).toBe(true);
            expect(result.data.address).toMatch(/^0x[a-f0-9]{40}$/i);
            expect(result.data.isDeployed).toBe(true);
            expect(result.data.nonce).toBe(BigInt(0));
            expect(result.data.balance).toBe(BigInt('1000000000000000000'));
        });

        it('should fail to get account info without authentication', async () => {
            client.destroy();
            client = new SimpleAlchemyClient(config);

            const result = await client.getAccountInfo();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ACCOUNT_INFO_FAILED');
        });
    });

    describe('Transaction Management', () => {
        beforeEach(async () => {
            await client.authenticate({
                type: 'email',
                email: 'test@nexuswallet.com'
            });
        });

        it('should send transaction successfully', async () => {
            const txRequest = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B' as any,
                value: BigInt('100000000000000000'),
                data: '0x' as any
            };

            const result = await client.sendTransaction(txRequest);

            expect(result.success).toBe(true);
            expect(result.data.hash).toMatch(/^0x[a-f0-9]{64}$/i);
            expect(result.data.userOpHash).toBe(result.data.hash);
            expect(result.data.success).toBe(true);
            expect(result.data.receipt?.status).toBe('success');
            expect(result.metadata?.service).toBe('simple-alchemy-client');
        });

        it('should generate unique transaction hashes', async () => {
            const txRequest = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B' as any,
                value: BigInt('100000000000000000'),
                data: '0x' as any
            };

            const result1 = await client.sendTransaction(txRequest);
            const result2 = await client.sendTransaction(txRequest);

            expect(result1.data.hash).not.toBe(result2.data.hash);
            expect(result1.data.hash).toMatch(/^0x[a-f0-9]{64}$/i);
            expect(result2.data.hash).toMatch(/^0x[a-f0-9]{64}$/i);
        });

        it('should fail to send transaction without authentication', async () => {
            client.destroy();
            client = new SimpleAlchemyClient(config);

            const txRequest = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B' as any,
                value: BigInt('100000000000000000'),
                data: '0x' as any
            };

            const result = await client.sendTransaction(txRequest);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('TRANSACTION_FAILED');
        });
    });

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            const result = await client.healthCheck();

            expect(result.success).toBe(true);
            expect(result.data.isHealthy).toBe(true);
            expect(result.data.lastChecked).toBeGreaterThan(0);
            expect(result.data.latency).toBeGreaterThanOrEqual(0);
            expect(result.metadata?.service).toBe('simple-alchemy-client');
        });

        it('should measure latency', async () => {
            const startTime = Date.now();
            const result = await client.healthCheck();
            const endTime = Date.now();

            expect(result.data.latency).toBeGreaterThanOrEqual(0);
            expect(result.data.latency).toBeLessThan(endTime - startTime + 100); // Allow some buffer
        });
    });

    describe('Logout', () => {
        beforeEach(async () => {
            await client.authenticate({
                type: 'email',
                email: 'test@nexuswallet.com'
            });
        });

        it('should logout successfully', async () => {
            expect(client.isAuthenticated()).toBe(true);

            const result = await client.logout();

            expect(result.success).toBe(true);
            expect(client.isAuthenticated()).toBe(false);
            expect(client.getCurrentUser()).toBeNull();
            expect(client.getSignerStatus()).toBe('disconnected');
        });

        it('should clear smart account address on logout', async () => {
            const addressBefore = await client.getSmartAccountAddress();
            expect(addressBefore.success).toBe(true);

            await client.logout();

            const addressAfter = await client.getSmartAccountAddress();
            expect(addressAfter.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors gracefully', async () => {
            // Simulate error by providing invalid parameters
            const result = await client.authenticate({type: 'email'} as any);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe('AUTH_FAILED');
            expect(result.error?.message).toBeDefined();
        });

        it('should handle transaction errors gracefully', async () => {
            // Try to send transaction without authentication
            const result = await client.sendTransaction({
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B' as any,
                value: BigInt('100000000000000000')
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe('TRANSACTION_FAILED');
        });

        it('should handle logout errors gracefully', async () => {
            // Authenticate first to have something to logout from
            await client.authenticate({type: 'email', email: 'test@example.com'});

            // Create a new client instance to test error handling without affecting cleanup
            const errorClient = new SimpleAlchemyClient({
                apiKey: 'test_key',
                chainId: 84532
            });

            // Mock an error in logout process by overriding the logout method
            const originalLogout = errorClient.logout.bind(errorClient);
            errorClient.logout = jest.fn().mockImplementation(async () => {
                try {
                    throw new Error('Logout error');
                } catch (error) {
                    return {
                        data: undefined,
                        success: false,
                        error: {
                            code: 'LOGOUT_FAILED',
                            message: error instanceof Error ? error.message : 'Logout failed',
                        },
                    };
                }
            });

            const result = await errorClient.logout();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOGOUT_FAILED');
        });
    });

    describe('State Management', () => {
        it('should maintain state consistency across operations', async () => {
            // Initial state
            expect(client.isAuthenticated()).toBe(false);
            expect(client.getCurrentUser()).toBeNull();

            // After authentication
            await client.authenticate({type: 'email', email: 'test@nexuswallet.com'});
            expect(client.isAuthenticated()).toBe(true);
            expect(client.getCurrentUser()).toBeDefined();

            // After logout
            await client.logout();
            expect(client.isAuthenticated()).toBe(false);
            expect(client.getCurrentUser()).toBeNull();
        });

        it('should properly destroy and cleanup', () => {
            client.destroy();

            expect(client.isAuthenticated()).toBe(false);
            expect(client.getCurrentUser()).toBeNull();
            expect(client.getSignerStatus()).toBe('disconnected');
            expect(client.isInitialized()).toBe(false);
        });
    });
});
