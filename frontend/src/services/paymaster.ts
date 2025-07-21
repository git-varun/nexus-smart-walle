import {UserOperation} from '../types/account';

export interface PaymasterConfig {
    rpcUrl: string;
    apiKey?: string;
    policyId?: string;
}

export interface PaymasterResponse {
    paymasterAndData: string;
    preVerificationGas?: string;
    verificationGasLimit?: string;
    callGasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

export interface SponsorshipInfo {
    sponsor: string;
    validUntil: number;
    validAfter: number;
}

export class PaymasterService {
    private config: PaymasterConfig;

    constructor(config: PaymasterConfig) {
        this.config = config;
    }

    async getPaymasterAndData(userOp: UserOperation): Promise<PaymasterResponse> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.config.apiKey) {
                headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            }

            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'pm_sponsorUserOperation',
                    params: [userOp, {
                        entryPoint: import.meta.env.VITE_ENTRY_POINT_ADDRESS,
                        ...(this.config.policyId && {policyId: this.config.policyId}),
                    }],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Paymaster error:', error);
            throw error;
        }
    }

    async validatePaymasterUserOp(userOp: UserOperation): Promise<boolean> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && {'Authorization': `Bearer ${this.config.apiKey}`}),
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'pm_validateSponsorshipPaymaster',
                    params: [userOp, import.meta.env.VITE_ENTRY_POINT_ADDRESS],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result.valid;
        } catch (error) {
            console.error('Paymaster validation error:', error);
            return false;
        }
    }

    async getSponsorshipInfo(userOp: UserOperation): Promise<SponsorshipInfo | null> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && {'Authorization': `Bearer ${this.config.apiKey}`}),
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'pm_getSponsorshipInfo',
                    params: [userOp],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Paymaster sponsorship info error:', error);
            return null;
        }
    }

    async getPolicies(): Promise<any[]> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && {'Authorization': `Bearer ${this.config.apiKey}`}),
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'pm_getPolicies',
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
            console.error('Paymaster policies error:', error);
            return [];
        }
    }

    async getGasAndPaymasterAndData(userOp: UserOperation): Promise<{
        preVerificationGas: string;
        verificationGasLimit: string;
        callGasLimit: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        paymasterAndData: string;
    }> {
        try {
            const response = await fetch(this.config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && {'Authorization': `Bearer ${this.config.apiKey}`}),
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'pm_getGasAndPaymasterAndData',
                    params: [userOp, {
                        entryPoint: import.meta.env.VITE_ENTRY_POINT_ADDRESS,
                        ...(this.config.policyId && {policyId: this.config.policyId}),
                    }],
                    id: 1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            return data.result;
        } catch (error) {
            console.error('Paymaster getGasAndPaymasterAndData error:', error);
            throw error;
        }
    }
}

// Default paymaster instance
export const paymasterService = new PaymasterService({
    rpcUrl: import.meta.env.VITE_PAYMASTER_RPC_URL || 'https://api.stackup.sh/v1/paymaster/YOUR_API_KEY',
    apiKey: import.meta.env.VITE_PAYMASTER_API_KEY,
    policyId: import.meta.env.VITE_PAYMASTER_POLICY_ID,
});
