import {PublicClient, WalletClient} from 'viem';
import {SimpleAlchemyClient as AlchemyClient, AlchemyClientConfig} from '../providers/alchemy/SimpleAlchemyClient';

export interface AlchemyServiceConfig {
    apiKey: string;
    policyId?: string;
    chainId: number;
    enableGasManager?: boolean;
}

export class AlchemyService {
    private static instance: AlchemyService;
    private alchemyClient: AlchemyClient | null = null;
    private config: AlchemyServiceConfig;
    private publicClient?: PublicClient;
    private walletClient?: WalletClient;

    private constructor(config: AlchemyServiceConfig) {
        this.config = config;
        console.log('🏗️ Alchemy Service initialized:', {
            hasApiKey: !!config.apiKey,
            chainId: config.chainId,
            enableGasManager: config.enableGasManager,
        });
    }

    public static getInstance(config?: AlchemyServiceConfig): AlchemyService {
        if (!AlchemyService.instance && config) {
            AlchemyService.instance = new AlchemyService(config);
        }
        return AlchemyService.instance;
    }

    public initialize(publicClient: PublicClient, walletClient?: WalletClient): void {
        this.publicClient = publicClient;
        this.walletClient = walletClient;

        const alchemyConfig: AlchemyClientConfig = {
            apiKey: this.config.apiKey,
            policyId: this.config.policyId,
            chainId: this.config.chainId,
            gasManagerConfig: this.config.policyId ? {
                policyId: this.config.policyId,
            } : undefined,
        };

        this.alchemyClient = new AlchemyClient(alchemyConfig);

        console.log('🔌 Alchemy Service clients updated:', {
            hasPublicClient: !!publicClient,
            hasWalletClient: !!walletClient,
            chainId: this.config.chainId,
            hasAlchemyClient: !!this.alchemyClient,
        });
    }

    public updateWalletClient(walletClient: WalletClient): void {
        this.walletClient = walletClient;
    }

    public updateConfig(config: AlchemyServiceConfig): void {
        this.config = config;

        if (this.alchemyClient) {
            this.alchemyClient.destroy();
        }

        const alchemyConfig: AlchemyClientConfig = {
            apiKey: config.apiKey,
            policyId: config.policyId,
            chainId: config.chainId,
            gasManagerConfig: config.policyId ? {
                policyId: config.policyId,
            } : undefined,
        };

        this.alchemyClient = new AlchemyClient(alchemyConfig);

        console.log('🔄 Alchemy Service config updated:', {
            chainId: config.chainId,
            hasGasManager: !!config.policyId,
        });
    }

    public getAlchemyClient(): AlchemyClient | null {
        return this.alchemyClient;
    }

    public getPublicClient(): PublicClient | undefined {
        return this.publicClient;
    }

    public getWalletClient(): WalletClient | undefined {
        return this.walletClient;
    }

    public getConfig(): AlchemyServiceConfig {
        return this.config;
    }

    public async getSystemHealth(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        services: {
            alchemy: { healthy: boolean; latency: number };
        };
        timestamp: number;
    }> {
        let alchemyHealth = {healthy: false, latency: 0};

        if (this.alchemyClient) {
            try {
                const healthResult = await this.alchemyClient.healthCheck();
                alchemyHealth = {
                    healthy: healthResult.success && healthResult.data.isHealthy,
                    latency: healthResult.data.latency,
                };
            } catch (error) {
                console.warn('Health check failed:', error);
                alchemyHealth = {healthy: false, latency: 0};
            }
        }

        const overall = alchemyHealth.healthy ? 'healthy' : 'unhealthy';

        return {
            overall,
            services: {
                alchemy: alchemyHealth,
            },
            timestamp: Date.now(),
        };
    }

    public getChainId(): number {
        return this.config.chainId;
    }

    public hasGasManager(): boolean {
        return !!this.config.policyId;
    }

    public isInitialized(): boolean {
        return !!this.alchemyClient && !!this.publicClient;
    }

    public destroy(): void {
        if (this.alchemyClient) {
            this.alchemyClient.destroy();
            this.alchemyClient = null;
        }
        console.log('🔥 Alchemy Service destroyed');
    }

    public getDebugInfo() {
        return {
            config: {
                chainId: this.config.chainId,
                hasApiKey: !!this.config.apiKey,
                hasPolicyId: !!this.config.policyId,
                enableGasManager: this.config.enableGasManager,
            },
            alchemy: {
                isInitialized: !!this.alchemyClient,
                isAuthenticated: this.alchemyClient?.isAuthenticated() || false,
                currentUser: this.alchemyClient?.getCurrentUser() || null,
            },
            clients: {
                publicClient: !!this.publicClient,
                walletClient: !!this.walletClient,
            },
        };
    }
}

export function createAlchemyService(config: AlchemyServiceConfig): AlchemyService {
    return AlchemyService.getInstance(config);
}