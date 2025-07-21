import {UserOperation} from '../types/account';

export interface BundlerConfig {
    rpcUrl: string;
    entryPointAddress: string;
    chainId: number;
}

export interface BundlerResponse {
    userOpHash: string;
    transactionHash?: string;
    blockHash?: string;
    blockNumber?: number;
}

export class BundlerService {
    private config: BundlerConfig;

    constructor(config: BundlerConfig) {
        this.config = config;
    }

    async sendUserOperation(userOp: UserOperation): Promise<string> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_sendUserOperation',
                    params: [userOp, this.config.entryPointAddress],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Bundler error:', error);
            throw error;
        }
    }

    async getUserOperationByHash(userOpHash: string): Promise<any> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getUserOperationByHash',
                    params: [userOpHash],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Bundler getUserOperationByHash error:', error);
            throw error;
        }
    }

    async getUserOperationReceipt(userOpHash: string): Promise<any> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getUserOperationReceipt',
                    params: [userOpHash],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Bundler getUserOperationReceipt error:', error);
            throw error;
        }
    }

    async estimateUserOperationGas(userOp: UserOperation): Promise<{
        preVerificationGas: string;
        verificationGasLimit: string;
        callGasLimit: string;
    }> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_estimateUserOperationGas',
                    params: [userOp, this.config.entryPointAddress],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Bundler estimateUserOperationGas error:', error);
            throw error;
        }
    }

    async getSupportedEntryPoints(): Promise<string[]> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_supportedEntryPoints',
                    params: [],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Bundler getSupportedEntryPoints error:', error);
            throw error;
        }
    }
}

// Default bundler instance
export const bundlerService = new BundlerService({
    rpcUrl: import.meta.env.VITE_BUNDLER_RPC_URL || 'https://api.stackup.sh/v1/node/YOUR_API_KEY',
    entryPointAddress: import.meta.env.VITE_ENTRY_POINT_ADDRESS || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '84532'),
});
