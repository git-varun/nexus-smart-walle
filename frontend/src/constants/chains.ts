import {baseSepolia} from 'wagmi/chains'

export const SUPPORTED_CHAINS = [baseSepolia]

export const CHAIN_CONFIG = {
    [baseSepolia.id]: {
        name: 'Base Sepolia',
        rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
        blockExplorer: 'https://sepolia.basescan.org',
        bundlerUrl: `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
    },
} as const
