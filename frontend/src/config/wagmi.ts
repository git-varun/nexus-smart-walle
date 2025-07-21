// frontend/src/config/wagmi.ts
import {getDefaultConfig} from '@rainbow-me/rainbowkit'
import {baseSepolia} from 'wagmi/chains'
import * as process from "node:process";

export const config = getDefaultConfig({
    appName: 'Smart Wallet ERC-4337',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [baseSepolia],
    ssr: false,
})
