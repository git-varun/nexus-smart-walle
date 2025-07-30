import {AlchemyService, AlchemyServiceConfig} from '../../../src/services/AlchemyService';
import {MockSimpleAlchemyClient} from '../../mocks/alchemyMocks';
import '../../mocks/viemMocks';

// Mock the SimpleAlchemyClient module
jest.mock('../../../src/providers/alchemy/SimpleAlchemyClient', () => {
    return {
        SimpleAlchemyClient: jest.fn().mockImplementation((config) => {
            return new (require('../../mocks/alchemyMocks').MockSimpleAlchemyClient)(config);
        })
    };
});

describe('AlchemyService', () => {
    let alchemyService: AlchemyService;
    let mockConfig: AlchemyServiceConfig;

    beforeEach(() => {
        // Clear any existing singleton instance
        (AlchemyService as any).instance = undefined;

        mockConfig = {
            apiKey: 'test_api_key',
            chainId: 84532,
            enableGasManager: true,
            policyId: 'test_policy_id'
        };
    });

    afterEach(() => {
        if (alchemyService) {
            alchemyService.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('should create a singleton instance', () => {
            const instance1 = AlchemyService.getInstance(mockConfig);
            const instance2 = AlchemyService.getInstance();

            expect(instance1).toBe(instance2);
            expect(instance1).toBeInstanceOf(AlchemyService);
        });

        it('should not create a new instance without config if none exists', () => {
            const instance = AlchemyService.getInstance();
            expect(instance).toBeUndefined();
        });

        it('should return existing instance even without config', () => {
            const instance1 = AlchemyService.getInstance(mockConfig);
            const instance2 = AlchemyService.getInstance();

            expect(instance2).toBe(instance1);
        });
    });

    describe('Initialization', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
        });

        it('should initialize with correct config', () => {
            const config = alchemyService.getConfig();

            expect(config).toEqual(mockConfig);
            expect(config.apiKey).toBe('test_api_key');
            expect(config.chainId).toBe(84532);
            expect(config.enableGasManager).toBe(true);
            expect(config.policyId).toBe('test_policy_id');
        });

        it('should initialize with public client', () => {
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};

            alchemyService.initialize(mockPublicClient as any);

            expect(alchemyService.getPublicClient()).toBe(mockPublicClient);
            expect(alchemyService.isInitialized()).toBe(true);
        });

        it('should initialize with both public and wallet clients', () => {
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            const mockWalletClient = {signMessage: jest.fn(), sendTransaction: jest.fn()};

            alchemyService.initialize(mockPublicClient as any, mockWalletClient as any);

            expect(alchemyService.getPublicClient()).toBe(mockPublicClient);
            expect(alchemyService.getWalletClient()).toBe(mockWalletClient);
            expect(alchemyService.isInitialized()).toBe(true);
        });
    });

    describe('Client Management', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);
        });

        it('should return alchemy client after initialization', () => {
            const client = alchemyService.getAlchemyClient();
            expect(client).toBeDefined();
            expect(client).toHaveProperty('authenticate');
            expect(client).toHaveProperty('getSmartAccountAddress');
            expect(client).toHaveProperty('sendTransaction');
        });

        it('should update wallet client', () => {
            const newWalletClient = {signMessage: jest.fn(), sendTransaction: jest.fn()};

            alchemyService.updateWalletClient(newWalletClient as any);

            expect(alchemyService.getWalletClient()).toBe(newWalletClient);
        });

        it('should update config and recreate client', () => {
            const newConfig: AlchemyServiceConfig = {
                apiKey: 'new_api_key',
                chainId: 1,
                enableGasManager: false
            };

            alchemyService.updateConfig(newConfig);

            const updatedConfig = alchemyService.getConfig();
            expect(updatedConfig.apiKey).toBe('new_api_key');
            expect(updatedConfig.chainId).toBe(1);
            expect(updatedConfig.enableGasManager).toBe(false);
        });
    });

    describe('System Health', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);
        });

        it('should return healthy status when client is healthy', async () => {
            const health = await alchemyService.getSystemHealth();

            expect(health.overall).toBe('healthy');
            expect(health.services.alchemy.healthy).toBe(true);
            expect(health.services.alchemy.latency).toBeGreaterThanOrEqual(0);
            expect(health.timestamp).toBeGreaterThan(0);
        });

        it('should return unhealthy status when no client', async () => {
            alchemyService.destroy();

            const health = await alchemyService.getSystemHealth();

            expect(health.overall).toBe('unhealthy');
            expect(health.services.alchemy.healthy).toBe(false);
            expect(health.services.alchemy.latency).toBe(0);
        });
    });

    describe('Configuration Methods', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
        });

        it('should return correct chain ID', () => {
            expect(alchemyService.getChainId()).toBe(84532);
        });

        it('should return gas manager status', () => {
            expect(alchemyService.hasGasManager()).toBe(true);

            const configWithoutGasManager = {...mockConfig, policyId: undefined};
            alchemyService.updateConfig(configWithoutGasManager);

            expect(alchemyService.hasGasManager()).toBe(false);
        });

        it('should return initialization status', () => {
            expect(alchemyService.isInitialized()).toBe(false);

            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);

            expect(alchemyService.isInitialized()).toBe(true);
        });
    });

    describe('Debug Information', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);
        });

        it('should return comprehensive debug info', () => {
            const debugInfo = alchemyService.getDebugInfo();

            expect(debugInfo.config.chainId).toBe(84532);
            expect(debugInfo.config.hasApiKey).toBe(true);
            expect(debugInfo.config.hasPolicyId).toBe(true);
            expect(debugInfo.config.enableGasManager).toBe(true);

            expect(debugInfo.alchemy.isInitialized).toBe(true);
            expect(debugInfo.alchemy.isAuthenticated).toBe(false);
            expect(debugInfo.alchemy.currentUser).toBeNull();

            expect(debugInfo.clients.publicClient).toBe(true);
            expect(debugInfo.clients.walletClient).toBe(false);
        });

        it('should reflect authentication state in debug info', async () => {
            const client = alchemyService.getAlchemyClient();
            await client?.authenticate({type: 'email', email: 'test@example.com'});

            const debugInfo = alchemyService.getDebugInfo();

            expect(debugInfo.alchemy.isAuthenticated).toBe(true);
            expect(debugInfo.alchemy.currentUser).toEqual({
                email: 'test@example.com',
                userId: expect.any(String)
            });
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            alchemyService = AlchemyService.getInstance(mockConfig);
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);
        });

        it('should properly destroy service and cleanup resources', () => {
            expect(alchemyService.isInitialized()).toBe(true);

            alchemyService.destroy();

            expect(alchemyService.getAlchemyClient()).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing configuration gracefully', () => {
            expect(() => {
                AlchemyService.getInstance();
            }).not.toThrow();
        });

        it('should handle health check failures gracefully', async () => {
            alchemyService = AlchemyService.getInstance(mockConfig);
            const mockPublicClient = {getBalance: jest.fn(), getBlockNumber: jest.fn()};
            alchemyService.initialize(mockPublicClient as any);

            // Mock the health check to fail
            const client = alchemyService.getAlchemyClient();
            if (client) {
                jest.spyOn(client, 'healthCheck').mockRejectedValue(new Error('Health check failed'));
            }

            const health = await alchemyService.getSystemHealth();

            expect(health.overall).toBe('unhealthy');
            expect(health.services.alchemy.healthy).toBe(false);
        });
    });
});
