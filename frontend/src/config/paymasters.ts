export interface PaymasterEndpoint {
    chainId: number;
    url: string;
    policyId?: string;
}

export interface PaymasterFeature {
    name: string;
    description: string;
    supported: boolean;
}

export interface PaymasterConfig {
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
    gasSponsorship: 'full' | 'partial' | 'conditional';
    supportedChains: number[];
    endpoints: PaymasterEndpoint[];
    features: PaymasterFeature[];
    pricing: {
        model: 'free' | 'freemium' | 'paid' | 'credit-based';
        description: string;
        limits?: string;
        costPerOperation?: string;
    };
    sponsorshipPolicies: {
        name: string;
        description: string;
        limits: string;
    }[];
    limits: {
        dailySponsorship?: string;
        monthlySponsorship?: string;
        perTransactionLimit?: string;
    };
}

export const PAYMASTER_PROVIDERS: Record<string, PaymasterConfig> = {
    // Alchemy Gas Manager
    'alchemy': {
        id: 'alchemy',
        name: 'alchemy-gas-manager',
        displayName: 'Alchemy Gas Manager',
        provider: 'Alchemy',
        description: 'Enterprise-grade gas sponsorship with flexible policies',
        icon: '⛽',
        website: 'https://www.alchemy.com/gas-manager',
        documentation: 'https://docs.alchemy.com/account-kit/gas-manager',
        recommended: true,
        popular: true,
        reliability: 'high',
        gasSponsorship: 'full',
        supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532, 421614, 11155420],
        endpoints: [
            {chainId: 1, url: 'https://eth-mainnet.g.alchemy.com/v2/', policyId: 'policy_id_here'},
            {chainId: 137, url: 'https://polygon-mainnet.g.alchemy.com/v2/', policyId: 'policy_id_here'},
            {chainId: 8453, url: 'https://base-mainnet.g.alchemy.com/v2/', policyId: 'policy_id_here'},
            {chainId: 84532, url: 'https://base-sepolia.g.alchemy.com/v2/', policyId: 'policy_id_here'}
        ],
        features: [
            {name: 'Full Gas Sponsorship', description: 'Complete transaction fee coverage', supported: true},
            {name: 'Conditional Sponsorship', description: 'Rule-based gas sponsorship', supported: true},
            {name: 'Spending Limits', description: 'Per-user spending limits', supported: true},
            {name: 'Policy Engine', description: 'Advanced policy configuration', supported: true},
            {name: 'Analytics Dashboard', description: 'Detailed spending analytics', supported: true},
            {name: 'Webhook Integration', description: 'Real-time notifications', supported: true}
        ],
        pricing: {
            model: 'credit-based',
            description: 'Pay per sponsored transaction',
            costPerOperation: '$0.001 - $0.05 per UserOp',
            limits: '$10 free credits'
        },
        sponsorshipPolicies: [
            {name: 'Full Sponsorship', description: 'Sponsor all gas fees', limits: 'Up to $100/day'},
            {name: 'Partial Sponsorship', description: 'Sponsor 50% of gas fees', limits: 'Up to $200/day'},
            {name: 'Conditional', description: 'Sponsor based on user criteria', limits: 'Custom limits'}
        ],
        limits: {
            dailySponsorship: '$100 (default policy)',
            monthlySponsorship: '$3,000 (default policy)',
            perTransactionLimit: '$5.00'
        }
    },

    // Pimlico Paymaster
    'pimlico': {
        id: 'pimlico',
        name: 'pimlico-paymaster',
        displayName: 'Pimlico Paymaster',
        provider: 'Pimlico',
        description: 'Advanced paymaster with ERC-20 token payments and sponsorship',
        icon: '💰',
        website: 'https://pimlico.io/paymaster',
        documentation: 'https://docs.pimlico.io/paymaster',
        recommended: true,
        popular: true,
        reliability: 'high',
        gasSponsorship: 'full',
        supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532, 421614],
        endpoints: [
            {chainId: 1, url: 'https://api.pimlico.io/v2/ethereum/rpc'},
            {chainId: 137, url: 'https://api.pimlico.io/v2/polygon/rpc'},
            {chainId: 8453, url: 'https://api.pimlico.io/v2/base/rpc'},
            {chainId: 84532, url: 'https://api.pimlico.io/v2/base-sepolia/rpc'}
        ],
        features: [
            {name: 'Full Gas Sponsorship', description: 'Complete fee sponsorship', supported: true},
            {name: 'ERC-20 Gas Payments', description: 'Pay gas with any ERC-20 token', supported: true},
            {name: 'Hybrid Paymaster', description: 'Combined sponsorship and token payments', supported: true},
            {name: 'Dynamic Policies', description: 'Real-time policy adjustments', supported: true},
            {name: 'Multi-Token Support', description: 'Support for multiple payment tokens', supported: true},
            {name: 'MEV Protection', description: 'Protection for sponsored transactions', supported: true}
        ],
        pricing: {
            model: 'freemium',
            description: 'Free tier + usage-based pricing',
            costPerOperation: '$0.0005 - $0.03 per UserOp',
            limits: '$5 free credits'
        },
        sponsorshipPolicies: [
            {name: 'Sponsor All', description: 'Sponsor all eligible transactions', limits: '$50/day'},
            {name: 'Token Payment', description: 'Users pay with ERC-20 tokens', limits: 'No sponsorship limit'},
            {name: 'Hybrid Mode', description: 'Mix of sponsorship and token payment', limits: '$25/day sponsored'}
        ],
        limits: {
            dailySponsorship: '$50 (default policy)',
            monthlySponsorship: '$1,500 (default policy)',
            perTransactionLimit: '$2.50'
        }
    },

    // Coinbase Paymaster
    'coinbase': {
        id: 'coinbase',
        name: 'coinbase-paymaster',
        displayName: 'Coinbase Paymaster',
        provider: 'Coinbase',
        description: 'Base-optimized paymaster with Coinbase ecosystem integration',
        icon: '🔵',
        website: 'https://www.coinbase.com/developer-platform/paymaster',
        documentation: 'https://docs.cdp.coinbase.com/paymaster',
        recommended: false,
        popular: true,
        reliability: 'high',
        gasSponsorship: 'conditional',
        supportedChains: [8453, 84532, 1], // Primarily Base-focused
        endpoints: [
            {chainId: 8453, url: 'https://api.developer.coinbase.com/rpc/v1/base/paymaster'},
            {chainId: 84532, url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/paymaster'}
        ],
        features: [
            {name: 'Base Integration', description: 'Native Base ecosystem support', supported: true},
            {name: 'Conditional Sponsorship', description: 'Criteria-based sponsorship', supported: true},
            {name: 'Coinbase Account Link', description: 'Link to Coinbase accounts', supported: true},
            {name: 'USD Coin Payments', description: 'Pay gas fees with USDC', supported: true},
            {name: 'KYC Integration', description: 'Identity-verified sponsorship', supported: true},
            {name: 'Compliance Tools', description: 'Built-in compliance features', supported: true}
        ],
        pricing: {
            model: 'freemium',
            description: 'Free tier on Base, usage-based on other chains',
            costPerOperation: 'Free on Base (limited), $0.002 elsewhere',
            limits: '100 operations/day free on Base'
        },
        sponsorshipPolicies: [
            {name: 'Base Free Tier', description: 'Free sponsorship on Base', limits: '100 ops/day'},
            {name: 'USDC Payment', description: 'Pay with USDC', limits: 'No sponsorship needed'},
            {name: 'KYC Users', description: 'Enhanced limits for verified users', limits: '500 ops/day'}
        ],
        limits: {
            dailySponsorship: '100 operations (Base free tier)',
            monthlySponsorship: '3,000 operations (Base free tier)',
            perTransactionLimit: '$1.00'
        }
    },

    // Biconomy Paymaster
    'biconomy': {
        id: 'biconomy',
        name: 'biconomy-paymaster',
        displayName: 'Biconomy Paymaster',
        provider: 'Biconomy',
        description: 'Multi-chain paymaster with DeFi-optimized gas management',
        icon: '🌊',
        website: 'https://biconomy.io/paymaster',
        documentation: 'https://docs.biconomy.io/paymaster',
        recommended: false,
        popular: true,
        reliability: 'medium',
        gasSponsorship: 'full',
        supportedChains: [1, 137, 8453, 42161, 10, 80001, 84532],
        endpoints: [
            {chainId: 1, url: 'https://paymaster.biconomy.io/api/v1/1/'},
            {chainId: 137, url: 'https://paymaster.biconomy.io/api/v1/137/'},
            {chainId: 8453, url: 'https://paymaster.biconomy.io/api/v1/8453/'}
        ],
        features: [
            {name: 'DeFi Optimization', description: 'Optimized for DeFi transactions', supported: true},
            {name: 'Multi-Chain Support', description: 'Consistent experience across chains', supported: true},
            {name: 'Token Swaps', description: 'Built-in token swap for gas payments', supported: true},
            {name: 'Batch Sponsorship', description: 'Sponsor batch transactions', supported: true},
            {name: 'Yield Integration', description: 'Earn yield on sponsored funds', supported: false},
            {name: 'DAO Governance', description: 'Community governance features', supported: true}
        ],
        pricing: {
            model: 'freemium',
            description: 'Free tier with DeFi focus',
            costPerOperation: '$0.001 - $0.02 per UserOp',
            limits: '$2 free credits'
        },
        sponsorshipPolicies: [
            {name: 'DeFi Transactions', description: 'Sponsor DeFi interactions', limits: '$30/day'},
            {name: 'General Purpose', description: 'Sponsor any transaction', limits: '$10/day'},
            {name: 'High Volume', description: 'For high-volume applications', limits: '$100/day'}
        ],
        limits: {
            dailySponsorship: '$30 (DeFi tier)',
            monthlySponsorship: '$900 (DeFi tier)',
            perTransactionLimit: '$3.00'
        }
    },

    // Stackup Paymaster
    'stackup': {
        id: 'stackup',
        name: 'stackup-paymaster',
        displayName: 'Stackup Paymaster',
        provider: 'Stackup',
        description: 'Open-source paymaster with transparent fee structure',
        icon: '📚',
        website: 'https://www.stackup.sh/paymaster',
        documentation: 'https://docs.stackup.sh/paymaster',
        recommended: false,
        popular: false,
        reliability: 'medium',
        gasSponsorship: 'conditional',
        supportedChains: [1, 137, 8453, 42161, 84532],
        endpoints: [
            {chainId: 1, url: 'https://api.stackup.sh/v1/paymaster/1'},
            {chainId: 137, url: 'https://api.stackup.sh/v1/paymaster/137'},
            {chainId: 8453, url: 'https://api.stackup.sh/v1/paymaster/8453'}
        ],
        features: [
            {name: 'Open Source', description: 'Fully transparent implementation', supported: true},
            {name: 'Simple Sponsorship', description: 'Straightforward sponsorship rules', supported: true},
            {name: 'Community Driven', description: 'Community-governed policies', supported: true},
            {name: 'No Vendor Lock-in', description: 'Easy to migrate or self-host', supported: true},
            {name: 'Basic Analytics', description: 'Simple usage analytics', supported: true},
            {name: 'Fair Usage', description: 'Fair usage policy enforcement', supported: true}
        ],
        pricing: {
            model: 'free',
            description: 'Free with fair usage policy',
            limits: 'Fair usage limits apply'
        },
        sponsorshipPolicies: [
            {name: 'Fair Usage', description: 'Free sponsorship with fair limits', limits: '50 ops/day'},
            {name: 'Community Pool', description: 'Community-funded sponsorship', limits: '20 ops/day'}
        ],
        limits: {
            dailySponsorship: '50 operations',
            monthlySponsorship: '1,500 operations',
            perTransactionLimit: '$0.50'
        }
    }
};

// Helper functions
export const getPaymasterById = (id: string): PaymasterConfig | undefined => {
    return PAYMASTER_PROVIDERS[id];
};

export const getPaymastersByChain = (chainId: number): PaymasterConfig[] => {
    return Object.values(PAYMASTER_PROVIDERS).filter(paymaster =>
        paymaster.supportedChains.includes(chainId)
    );
};

export const getRecommendedPaymasters = (chainId?: number): PaymasterConfig[] => {
    let paymasters = Object.values(PAYMASTER_PROVIDERS).filter(paymaster => paymaster.recommended);

    if (chainId) {
        paymasters = paymasters.filter(paymaster => paymaster.supportedChains.includes(chainId));
    }

    return paymasters;
};

export const getPopularPaymasters = (chainId?: number): PaymasterConfig[] => {
    let paymasters = Object.values(PAYMASTER_PROVIDERS).filter(paymaster => paymaster.popular);

    if (chainId) {
        paymasters = paymasters.filter(paymaster => paymaster.supportedChains.includes(chainId));
    }

    return paymasters;
};

export const getPaymastersBySponsorship = (sponsorship: 'full' | 'partial' | 'conditional'): PaymasterConfig[] => {
    return Object.values(PAYMASTER_PROVIDERS).filter(paymaster => paymaster.gasSponsorship === sponsorship);
};

export const getPaymasterEndpoint = (paymasterId: string, chainId: number): PaymasterEndpoint | undefined => {
    const paymaster = getPaymasterById(paymasterId);
    return paymaster?.endpoints.find(endpoint => endpoint.chainId === chainId);
};

// Default selections
export const DEFAULT_PAYMASTER = 'alchemy';