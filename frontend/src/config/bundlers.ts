export interface BundlerEndpoint {
    chainId: number;
    url: string;
    apiKey?: string;
}

export interface BundlerFeature {
    name: string;
    description: string;
    supported: boolean;
}

export interface BundlerConfig {
    id: string;
    name: string;
    displayName: string;
    provider: string;
    description: string;
    icon: string;
    website: string;
    documentation: string;
    recommended: boolean;
    popular: boolean;
    reliability: 'high' | 'medium' | 'low';
    latency: 'low' | 'medium' | 'high';
    gasEfficiency: 'excellent' | 'good' | 'average';
    supportedChains: number[];
    endpoints: BundlerEndpoint[];
    features: BundlerFeature[];
    pricing: {
        model: 'free' | 'freemium' | 'paid';
        description: string;
        limits?: string;
    };
    limits: {
        rateLimit: string;
        dailyOperations?: string;
        monthlyOperations?: string;
    };
}

export const BUNDLER_PROVIDERS: Record<string, BundlerConfig> =
    {
        // Alchemy Bundler
        'alchemy': {
            id: 'alchemy',
            name: 'alchemy-bundler',
            displayName: 'Alchemy',
            provider: 'Alchemy',
            description: 'Enterprise-grade bundler with high reliability and performance',
            icon: '⚗️',
            website: 'https://www.alchemy.com',
            documentation: 'https://docs.alchemy.com/account-kit/bundler',
            recommended: true,
            popular: true,
            reliability: 'high',
            latency: 'low',
            gasEfficiency: 'excellent',
            supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532, 421614, 11155420],
            endpoints: [
                {chainId: 1, url: 'https://eth-mainnet.g.alchemy.com/v2/'},
                {chainId: 137, url: 'https://polygon-mainnet.g.alchemy.com/v2/'},
                {chainId: 8453, url: 'https://base-mainnet.g.alchemy.com/v2/'},
                {chainId: 42161, url: 'https://arb-mainnet.g.alchemy.com/v2/'},
                {chainId: 10, url: 'https://opt-mainnet.g.alchemy.com/v2/'},
                {chainId: 84532, url: 'https://base-sepolia.g.alchemy.com/v2/'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Accurate gas estimation for UserOps', supported: true},
                {name: 'Mempool Management', description: 'Advanced mempool monitoring', supported: true},
                {name: 'MEV Protection', description: 'Protection against MEV attacks', supported: true},
                {name: 'Simulation', description: 'UserOp simulation before submission', supported: true},
                {name: 'Analytics', description: 'Detailed operation analytics', supported: true},
                {name: 'Priority Processing', description: 'Fast-lane processing for paid tiers', supported: true}
            ],
            pricing: {
                model: 'freemium',
                description: 'Free tier with generous limits, paid tiers available',
                limits: '300M CU/month free'
            },
            limits: {
                rateLimit: '330 req/sec',
                dailyOperations: '10,000 (free tier)',
                monthlyOperations: '100,000 (free tier)'
            }
        },

        // Pimlico Bundler
        'pimlico': {
            id: 'pimlico',
            name: 'pimlico-bundler',
            displayName: 'Pimlico',
            provider: 'Pimlico',
            description: 'Specialized ERC-4337 infrastructure with advanced features',
            icon: '🏗️',
            website: 'https://pimlico.io',
            documentation: 'https://docs.pimlico.io/bundler',
            recommended: true,
            popular: true,
            reliability: 'high',
            latency: 'low',
            gasEfficiency: 'excellent',
            supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532, 421614, 11155420],
            endpoints: [
                {chainId: 1, url: 'https://api.pimlico.io/v1/ethereum/rpc'},
                {chainId: 137, url: 'https://api.pimlico.io/v1/polygon/rpc'},
                {chainId: 8453, url: 'https://api.pimlico.io/v1/base/rpc'},
                {chainId: 42161, url: 'https://api.pimlico.io/v1/arbitrum/rpc'},
                {chainId: 10, url: 'https://api.pimlico.io/v1/optimism/rpc'},
                {chainId: 84532, url: 'https://api.pimlico.io/v1/base-sepolia/rpc'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Advanced gas estimation algorithms', supported: true},
                {name: 'Mempool Management', description: 'Real-time mempool optimization', supported: true},
                {name: 'MEV Protection', description: 'Built-in MEV protection', supported: true},
                {name: 'Simulation', description: 'Comprehensive UserOp simulation', supported: true},
                {name: 'Analytics', description: 'Detailed bundling analytics', supported: true},
                {name: 'Custom Policies', description: 'Configurable bundling policies', supported: true}
            ],
            pricing: {
                model: 'freemium',
                description: 'Free tier available, usage-based pricing',
                limits: '10,000 UserOps/month free'
            },
            limits: {
                rateLimit: '100 req/sec',
                dailyOperations: '1,000 (free tier)',
                monthlyOperations: '10,000 (free tier)'
            }
        },

        // Coinbase Bundler
        'coinbase': {
            id: 'coinbase',
            name: 'coinbase-bundler',
            displayName: 'Coinbase',
            provider: 'Coinbase',
            description: 'Coinbase-operated bundler with Base chain optimization',
            icon: '🔵',
            website: 'https://www.coinbase.com/developer-platform',
            documentation: 'https://docs.cdp.coinbase.com/bundler',
            recommended: false,
            popular: true,
            reliability: 'high',
            latency: 'low',
            gasEfficiency: 'good',
            supportedChains: [8453, 84532, 1, 42161], // Optimized for Base
            endpoints: [
                {chainId: 8453, url: 'https://api.developer.coinbase.com/rpc/v1/base/'},
                {chainId: 84532, url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/'},
                {chainId: 1, url: 'https://api.developer.coinbase.com/rpc/v1/ethereum/'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Optimized for Base chain', supported: true},
                {name: 'Mempool Management', description: 'Base-optimized mempool', supported: true},
                {name: 'MEV Protection', description: 'Basic MEV protection', supported: false},
                {name: 'Simulation', description: 'UserOp simulation', supported: true},
                {name: 'Analytics', description: 'Basic operation analytics', supported: true},
                {name: 'Base Integration', description: 'Native Base ecosystem integration', supported: true}
            ],
            pricing: {
                model: 'freemium',
                description: 'Free tier with Base chain focus',
                limits: '1,000 requests/day free'
            },
            limits: {
                rateLimit: '50 req/sec',
                dailyOperations: '1,000 (free tier)',
                monthlyOperations: '30,000 (free tier)'
            }
        },

        // Thirdweb Bundler
        'thirdweb': {
            id: 'thirdweb',
            name: 'thirdweb-bundler',
            displayName: 'thirdweb',
            provider: 'thirdweb',
            description: 'Developer-friendly bundler with comprehensive tooling',
            icon: '🕸️',
            website: 'https://thirdweb.com',
            documentation: 'https://portal.thirdweb.com/account-abstraction/bundler',
            recommended: false,
            popular: true,
            reliability: 'medium',
            latency: 'medium',
            gasEfficiency: 'good',
            supportedChains: [1, 137, 8453, 42161, 10, 11155111, 84532],
            endpoints: [
                {chainId: 1, url: 'https://bundler.thirdweb.com/1'},
                {chainId: 137, url: 'https://bundler.thirdweb.com/137'},
                {chainId: 8453, url: 'https://bundler.thirdweb.com/8453'},
                {chainId: 42161, url: 'https://bundler.thirdweb.com/42161'},
                {chainId: 84532, url: 'https://bundler.thirdweb.com/84532'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Standard gas estimation', supported: true},
                {name: 'Mempool Management', description: 'Basic mempool handling', supported: true},
                {name: 'MEV Protection', description: 'No MEV protection', supported: false},
                {name: 'Simulation', description: 'UserOp simulation', supported: true},
                {name: 'Analytics', description: 'Developer-focused analytics', supported: true},
                {name: 'SDK Integration', description: 'Deep thirdweb SDK integration', supported: true}
            ],
            pricing: {
                model: 'freemium',
                description: 'Free tier for development, paid for production',
                limits: '1,000 UserOps/month free'
            },
            limits: {
                rateLimit: '30 req/sec',
                dailyOperations: '500 (free tier)',
                monthlyOperations: '5,000 (free tier)'
            }
        },

        // Stackup Bundler
        'stackup': {
            id: 'stackup',
            name: 'stackup-bundler',
            displayName: 'Stackup',
            provider: 'Stackup',
            description: 'Open-source bundler with transparency and reliability',
            icon: '📚',
            website: 'https://www.stackup.sh',
            documentation: 'https://docs.stackup.sh/bundler',
            recommended: false,
            popular: false,
            reliability: 'medium',
            latency: 'medium',
            gasEfficiency: 'average',
            supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532],
            endpoints: [
                {chainId: 1, url: 'https://api.stackup.sh/v1/bundler/1'},
                {chainId: 137, url: 'https://api.stackup.sh/v1/bundler/137'},
                {chainId: 8453, url: 'https://api.stackup.sh/v1/bundler/8453'},
                {chainId: 84532, url: 'https://api.stackup.sh/v1/bundler/84532'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Standard gas estimation', supported: true},
                {name: 'Mempool Management', description: 'Basic mempool management', supported: true},
                {name: 'MEV Protection', description: 'No MEV protection', supported: false},
                {name: 'Simulation', description: 'Basic simulation', supported: true},
                {name: 'Analytics', description: 'Open-source analytics', supported: false},
                {name: 'Open Source', description: 'Fully open-source implementation', supported: true}
            ],
            pricing: {
                model: 'free',
                description: 'Free to use with fair usage policy'
            },
            limits: {
                rateLimit: '20 req/sec',
                dailyOperations: '1,000 (fair usage)',
                monthlyOperations: '30,000 (fair usage)'
            }
        },

        // Candide Bundler
        'candide': {
            id: 'candide',
            name: 'candide-bundler',
            displayName: 'Candide',
            provider: 'Candide',
            description: 'Privacy-focused bundler with advanced security features',
            icon: '🕯️',
            website: 'https://candidewallet.com',
            documentation: 'https://docs.candidewallet.com/bundler',
            recommended: false,
            popular: false,
            reliability: 'medium',
            latency: 'medium',
            gasEfficiency: 'good',
            supportedChains: [1, 137, 8453, 42161, 84532],
            endpoints: [
                {chainId: 1, url: 'https://bundler.candidewallet.com/rpc/1'},
                {chainId: 137, url: 'https://bundler.candidewallet.com/rpc/137'},
                {chainId: 8453, url: 'https://bundler.candidewallet.com/rpc/8453'},
                {chainId: 84532, url: 'https://bundler.candidewallet.com/rpc/84532'}
            ],
            features: [
                {name: 'Gas Estimation', description: 'Privacy-preserving estimation', supported: true},
                {name: 'Mempool Management', description: 'Private mempool handling', supported: true},
                {name: 'MEV Protection', description: 'Privacy-based MEV protection', supported: true},
                {name: 'Simulation', description: 'Private simulation environment', supported: true},
                {name: 'Analytics', description: 'Privacy-focused analytics', supported: false},
                {name: 'Privacy Focus', description: 'Enhanced privacy features', supported: true}
            ],
            pricing: {
                model: 'freemium',
                description: 'Free tier with privacy focus',
                limits: '500 UserOps/month free'
            },
            limits: {
                rateLimit: '15 req/sec',
                dailyOperations: '200 (free tier)',
                monthlyOperations: '2,000 (free tier)'
            }
        }
    };

// Helper functions
export const getBundlerById = (id: string): BundlerConfig | undefined => {
    return BUNDLER_PROVIDERS[id];
};

export const getBundlersByChain = (chainId: number): BundlerConfig[] => {
    return Object.values(BUNDLER_PROVIDERS).filter(bundler =>
        bundler.supportedChains.includes(chainId)
    );
};

export const getRecommendedBundlers = (chainId?: number): BundlerConfig[] => {
    let bundlers = Object.values(BUNDLER_PROVIDERS).filter(bundler => bundler.recommended);

    if (chainId) {
        bundlers = bundlers.filter(bundler => bundler.supportedChains.includes(chainId));
    }

    return bundlers;
};

export const getPopularBundlers = (chainId?: number): BundlerConfig[] => {
    let bundlers = Object.values(BUNDLER_PROVIDERS).filter(bundler => bundler.popular);

    if (chainId) {
        bundlers = bundlers.filter(bundler => bundler.supportedChains.includes(chainId));
    }

    return bundlers;
};

export const getBundlersByReliability = (reliability: 'high' | 'medium' | 'low'): BundlerConfig[] => {
    return Object.values(BUNDLER_PROVIDERS).filter(bundler => bundler.reliability === reliability);
};

export const getBundlerEndpoint = (bundlerId: string, chainId: number): BundlerEndpoint | undefined => {
    const bundler = getBundlerById(bundlerId);
    return bundler?.endpoints.find(endpoint => endpoint.chainId === chainId);
};

// Default selections
export const DEFAULT_BUNDLER = 'alchemy';