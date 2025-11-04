export interface AccountTypeFeature {
    name: string;
    description: string;
    supported: boolean;
}

export interface AccountTypeConfig {
    id: string;
    name: string;
    displayName: string;
    provider: 'alchemy' | 'kernel' | 'biconomy';
    description: string;
    icon: string;
    version?: string;
    recommended: boolean;
    popular: boolean;
    gasOptimized: boolean;
    features: AccountTypeFeature[];
    supportedChains: number[]; // Chain IDs where this account type is supported
    deploymentCost: 'low' | 'medium' | 'high';
    complexity: 'simple' | 'intermediate' | 'advanced';
    documentation?: string;
}

export const ACCOUNT_TYPES: Record<string, AccountTypeConfig> = {
    // Alchemy Account Types
    'alchemy-light-v2': {
        id: 'alchemy-light-v2',
        name: 'light-account-v2',
        displayName: 'Light Account v2',
        provider: 'alchemy',
        description: 'Lightweight and gas-efficient smart account implementation',
        icon: '⚡',
        version: 'v2.0',
        recommended: true,
        popular: true,
        gasOptimized: true,
        deploymentCost: 'low',
        complexity: 'simple',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: false},
            {name: 'Plugin System', description: 'Extensible functionality', supported: false}
        ],
        supportedChains: [1, 137, 8453, 42161, 10, 11155111, 80001, 84532, 421614, 11155420],
        documentation: 'https://accountkit.alchemy.com/smart-accounts/light-account'
    },

    'alchemy-multiowner': {
        id: 'alchemy-multiowner',
        name: 'multi-owner-light-account',
        displayName: 'Multi-Owner Light Account',
        provider: 'alchemy',
        description: 'Light account with multiple owner support and enhanced security',
        icon: '👥',
        version: 'v1.0',
        recommended: false,
        popular: true,
        gasOptimized: true,
        deploymentCost: 'medium',
        complexity: 'intermediate',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Extensible functionality', supported: false}
        ],
        supportedChains: [1, 137, 8453, 42161, 10, 84532],
        documentation: 'https://accountkit.alchemy.com/smart-accounts/multi-owner-light-account'
    },

    'alchemy-modular': {
        id: 'alchemy-modular',
        name: 'modular-account',
        displayName: 'Modular Account',
        provider: 'alchemy',
        description: 'Highly extensible account with plugin architecture',
        icon: '🧩',
        version: 'v1.0',
        recommended: false,
        popular: false,
        gasOptimized: false,
        deploymentCost: 'high',
        complexity: 'advanced',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Extensible functionality', supported: true}
        ],
        supportedChains: [1, 137, 8453, 84532],
        documentation: 'https://accountkit.alchemy.com/smart-accounts/modular-account'
    },

    // Kernel Account Types
    'kernel-v2': {
        id: 'kernel-v2',
        name: 'kernel-v2',
        displayName: 'Kernel v2',
        provider: 'kernel',
        description: 'Advanced smart account with modular validator system',
        icon: '🔧',
        version: 'v2.4',
        recommended: false,
        popular: true,
        gasOptimized: true,
        deploymentCost: 'medium',
        complexity: 'intermediate',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Validator plugins', supported: true}
        ],
        supportedChains: [1, 137, 8453, 42161, 10, 84532],
        documentation: 'https://docs.zerodev.app/kernel-v2'
    },

    'kernel-v3': {
        id: 'kernel-v3',
        name: 'kernel-v3',
        displayName: 'Kernel v3',
        provider: 'kernel',
        description: 'Latest Kernel version with improved gas efficiency and features',
        icon: '⚙️',
        version: 'v3.0',
        recommended: true,
        popular: false,
        gasOptimized: true,
        deploymentCost: 'medium',
        complexity: 'advanced',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Enhanced validator system', supported: true}
        ],
        supportedChains: [1, 8453, 42161, 10, 84532],
        documentation: 'https://docs.zerodev.app/kernel-v3'
    },

    // Biconomy Account Types
    'biconomy-v2': {
        id: 'biconomy-v2',
        name: 'biconomy-smart-account-v2',
        displayName: 'Biconomy v2',
        provider: 'biconomy',
        description: 'Multi-chain compatible smart account optimized for DeFi',
        icon: '🌊',
        version: 'v2.0',
        recommended: false,
        popular: true,
        gasOptimized: true,
        deploymentCost: 'medium',
        complexity: 'intermediate',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: false},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Module-based extensions', supported: true}
        ],
        supportedChains: [1, 137, 8453, 42161, 10, 84532, 80001],
        documentation: 'https://docs.biconomy.io/smart-accounts'
    },

    'biconomy-nexus': {
        id: 'biconomy-nexus',
        name: 'nexus-smart-account',
        displayName: 'Biconomy Nexus',
        provider: 'biconomy',
        description: 'Next-generation modular smart account with enhanced security',
        icon: '💎',
        version: 'v1.0',
        recommended: false,
        popular: false,
        gasOptimized: false,
        deploymentCost: 'high',
        complexity: 'advanced',
        features: [
            {name: 'Gas Sponsorship', description: 'Sponsored transaction fees', supported: true},
            {name: 'Session Keys', description: 'Temporary key management', supported: true},
            {name: 'Batch Transactions', description: 'Execute multiple operations', supported: true},
            {name: 'Social Recovery', description: 'Guardian-based account recovery', supported: true},
            {name: 'Multi-signature', description: 'Multiple owner support', supported: true},
            {name: 'Plugin System', description: 'Advanced module system', supported: true}
        ],
        supportedChains: [1, 8453, 42161, 84532],
        documentation: 'https://docs.biconomy.io/nexus'
    }
};

// Helper functions
export const getAccountTypeById = (id: string): AccountTypeConfig | undefined => {
    return ACCOUNT_TYPES[id];
};

export const getAccountTypesByProvider = (provider: 'alchemy' | 'kernel' | 'biconomy'): AccountTypeConfig[] => {
    return Object.values(ACCOUNT_TYPES).filter(accountType => accountType.provider === provider);
};

export const getAccountTypesByChain = (chainId: number): AccountTypeConfig[] => {
    return Object.values(ACCOUNT_TYPES).filter(accountType =>
        accountType.supportedChains.includes(chainId)
    );
};

export const getRecommendedAccountTypes = (chainId?: number): AccountTypeConfig[] => {
    let accountTypes = Object.values(ACCOUNT_TYPES).filter(accountType => accountType.recommended);

    if (chainId) {
        accountTypes = accountTypes.filter(accountType =>
            accountType.supportedChains.includes(chainId)
        );
    }

    return accountTypes;
};

export const getPopularAccountTypes = (chainId?: number): AccountTypeConfig[] => {
    let accountTypes = Object.values(ACCOUNT_TYPES).filter(accountType => accountType.popular);

    if (chainId) {
        accountTypes = accountTypes.filter(accountType =>
            accountType.supportedChains.includes(chainId)
        );
    }

    return accountTypes;
};

export const getAccountTypesByComplexity = (complexity: 'simple' | 'intermediate' | 'advanced'): AccountTypeConfig[] => {
    return Object.values(ACCOUNT_TYPES).filter(accountType => accountType.complexity === complexity);
};

// Default selections
export const DEFAULT_ACCOUNT_TYPE = 'alchemy-light-v2';