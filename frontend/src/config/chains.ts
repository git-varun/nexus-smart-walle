import {ChainLogoMapper} from '../components/ui/ChainLogos';

export interface ChainConfig {
    chainId: number;
    name: string;
    displayName: string;
    symbol: string;
    rpcUrl: string;
    blockExplorer: string;
    logo: typeof ChainLogoMapper;
    testnet: boolean;
    popular: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
    // Ethereum Mainnet
    1: {
        chainId: 1,
        name: 'ethereum',
        displayName: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'https://ethereum.publicnode.com',
        blockExplorer: 'https://etherscan.io',
        logo: ChainLogoMapper,
        testnet: false,
        popular: true
    },

    // Ethereum Sepolia (Testnet)
    11155111: {
        chainId: 11155111,
        name: 'sepolia',
        displayName: 'Ethereum Sepolia',
        symbol: 'ETH',
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
        blockExplorer: 'https://sepolia.etherscan.io',
        logo: ChainLogoMapper,
        testnet: true,
        popular: false
    },

    // Polygon Mainnet
    137: {
        chainId: 137,
        name: 'polygon',
        displayName: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: 'https://polygon.publicnode.com',
        blockExplorer: 'https://polygonscan.com',
        logo: ChainLogoMapper,
        testnet: false,
        popular: true
    },

    // Polygon Mumbai (Testnet)
    80001: {
        chainId: 80001,
        name: 'mumbai',
        displayName: 'Polygon Mumbai',
        symbol: 'MATIC',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        blockExplorer: 'https://mumbai.polygonscan.com',
        logo: ChainLogoMapper,
        testnet: true,
        popular: false
    },

    // Base Mainnet
    8453: {
        chainId: 8453,
        name: 'base',
        displayName: 'Base',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.base.org',
        blockExplorer: 'https://basescan.org',
        logo: ChainLogoMapper,
        testnet: false,
        popular: true
    },

    // Base Sepolia (Testnet) - Current default
    84532: {
        chainId: 84532,
        name: 'base-sepolia',
        displayName: 'Base Sepolia',
        symbol: 'ETH',
        rpcUrl: 'https://sepolia.base.org',
        blockExplorer: 'https://sepolia.basescan.org',
        logo: ChainLogoMapper,
        testnet: true,
        popular: true // Popular for testing
    },

    // Arbitrum One
    42161: {
        chainId: 42161,
        name: 'arbitrum',
        displayName: 'Arbitrum One',
        symbol: 'ETH',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        blockExplorer: 'https://arbiscan.io',
        logo: ChainLogoMapper,
        testnet: false,
        popular: true
    },

    // Arbitrum Sepolia (Testnet)
    421614: {
        chainId: 421614,
        name: 'arbitrum-sepolia',
        displayName: 'Arbitrum Sepolia',
        symbol: 'ETH',
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        blockExplorer: 'https://sepolia.arbiscan.io',
        logo: ChainLogoMapper,
        testnet: true,
        popular: false
    },

    // Optimism Mainnet
    10: {
        chainId: 10,
        name: 'optimism',
        displayName: 'Optimism',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.optimism.io',
        blockExplorer: 'https://optimistic.etherscan.io',
        logo: ChainLogoMapper,
        testnet: false,
        popular: true
    },

    // Optimism Sepolia (Testnet)
    11155420: {
        chainId: 11155420,
        name: 'optimism-sepolia',
        displayName: 'Optimism Sepolia',
        symbol: 'ETH',
        rpcUrl: 'https://sepolia.optimism.io',
        blockExplorer: 'https://sepolia-optimism.etherscan.io',
        logo: ChainLogoMapper,
        testnet: true,
        popular: false
    }
};

// Helper functions
export const getChainById = (chainId: number): ChainConfig | undefined => {
    return SUPPORTED_CHAINS[chainId];
};

export const getPopularChains = (): ChainConfig[] => {
    return Object.values(SUPPORTED_CHAINS).filter(chain => chain.popular);
};

export const getMainnetChains = (): ChainConfig[] => {
    return Object.values(SUPPORTED_CHAINS).filter(chain => !chain.testnet);
};

export const getTestnetChains = (): ChainConfig[] => {
    return Object.values(SUPPORTED_CHAINS).filter(chain => chain.testnet);
};

export const DEFAULT_CHAIN_ID = 84532; // Base Sepolia for testing