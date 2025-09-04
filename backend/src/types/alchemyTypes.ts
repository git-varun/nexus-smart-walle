import {Address, Hash, Hex} from 'viem';

// Re-export existing types for compatibility
export type {UserOperation, UserOperationV06, UserOperationV07, AAVersion, GasEstimate} from './api';

// ===== CORE API TYPES =====

export interface AlchemyApiResponse<T = any> {
    jsonrpc: string;
    id: number;
    result?: T;
    error?: AlchemyApiError;
}

export interface AlchemyApiError {
    code: number;
    message: string;
    data?: any;
}

export interface AlchemyRequestConfig {
    timeout?: number;
    retries?: number;
    apiKey?: string;
    baseUrl?: string;
}

// ===== BUNDLER API TYPES =====

export interface UserOpResult {
    userOpHash: Hash;
    success: boolean;
    receipt?: UserOpReceipt;
    error?: string;
}

export interface UserOpStatus {
    userOpHash: Hash;
    entryPoint: Address;
    transactionHash?: Hash;
    blockNumber?: number;
    blockHash?: Hash;
    success?: boolean;
    reason?: string;
    actualGasCost?: string;
    actualGasUsed?: string;
    logs?: any[];
}

export interface UserOpReceipt {
    userOpHash: Hash;
    entryPoint: Address;
    sender: Address;
    nonce: string;
    paymaster?: Address;
    actualGasCost: string;
    actualGasUsed: string;
    success: boolean;
    reason?: string;
    logs: any[];
    receipt: {
        transactionHash: Hash;
        transactionIndex: number;
        blockHash: Hash;
        blockNumber: number;
        from: Address;
        to: Address;
        gasUsed: string;
        status: string;
    };
}

export interface SimulationResult {
    preOpGas: string;
    paid: string;
    validAfter: string;
    validUntil: string;
    targetSuccess: boolean;
    targetResult: string;
}

export interface BundlerConfig {
    entryPointVersion?: '0.6' | '0.7';
    chainId?: number;
}

export interface SendUserOpConfig extends BundlerConfig, AlchemyRequestConfig {
}

export interface EstimateGasConfig extends BundlerConfig, AlchemyRequestConfig {
    stateOverride?: Record<string, any>;
}

// ===== GAS MANAGER API TYPES =====

export interface PaymasterData {
    paymasterAndData?: string; // v0.6 format
    paymaster?: Address;       // v0.7 format
    paymasterData?: string;    // v0.7 format
    paymasterVerificationGasLimit?: string; // v0.7 format
    paymasterPostOpGasLimit?: string;       // v0.7 format
    callGasLimit?: string;
    verificationGasLimit?: string;
    preVerificationGas?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

// UserOperation interface is imported from './api' - removing duplicate

export interface SponsoredUserOp {
    sender: Address;
    paymasterAndData: string;
    sponsored: true;
    policyId: string;
    sponsorshipInfo: {
        policyId: string;
        sponsorAddress: Address;
        maxGasCost: string;
        expiresAt?: string;
    };
}

export interface GasPolicy {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'disabled';
    spendingRules: {
        maxSpendUsd?: number;
        maxSpendPerUserUsd?: number;
        maxSpendPerDayUsd?: number;
        allowedRecipients?: Address[];
        blockedRecipients?: Address[];
    };
    approvalRules: {
        requireApproval?: boolean;
        approvers?: Address[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface GasCostEstimate {
    gasLimit: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    totalCostWei: string;
    totalCostUsd?: string;
    sponsorshipAvailable: boolean;
    paymasterAddress?: Address;
}

export interface PaymasterOptions {
    paymasters: {
        address: Address;
        type: 'verifying' | 'erc20' | 'deposit';
        supportedTokens?: Address[];
        minBalance?: string;
    }[];
    policies: string[];
    chainId: number;
}

export interface GasPolicyConfig {
    name: string;
    spendingRules: {
        maxSpendUsd?: number;
        maxSpendPerUserUsd?: number;
        maxSpendPerDayUsd?: number;
        allowedRecipients?: Address[];
        blockedRecipients?: Address[];
    };
    approvalRules?: {
        requireApproval?: boolean;
        approvers?: Address[];
    };
}

export interface PolicyStatus {
    id: string;
    status: 'active' | 'paused' | 'disabled';
    usage: {
        totalSpentUsd: number;
        operationsCount: number;
        lastUsed?: string;
    };
    limits: {
        maxSpendUsd?: number;
        remainingSpendUsd?: number;
    };
}

export interface GasManagerConfig extends AlchemyRequestConfig {
    policyId?: string;
    sponsorshipType?: 'full' | 'partial';
}

// ===== SMART WALLET API TYPES =====

export interface SessionPermissions {
    validUntil: number;
    validAfter: number;
    sessionValidationModule: Address;
    sessionKeyData: string;
    permissions: {
        allowedTargets?: Address[];
        allowedFunctions?: string[];
        spendingLimits?: {
            token: Address;
            amount: string;
        }[];
    };
}

export interface SessionResult {
    sessionId: string;
    sessionPublicKey: Address;
    validUntil: number;
    validAfter: number;
    permissions: SessionPermissions;
    isActive: boolean;
}


// ===== LEGACY COMPATIBILITY TYPES =====

export interface AlchemyWalletRequestAccountResponse {
    accountAddress: string;
    id: string;
    counterfactualInfo?: {
        factoryType?: string;
        factoryAddress?: string;
        factoryData?: string;
        factory?: string;
        salt?: string;
        initCode?: string;
    };
}

// ===== ALCHEMY WALLET API ADDITIONAL TYPES =====

export interface WalletCall {
    to: Address;
    data: Hex;
    value?: string;
}

export interface PreparedCalls {
    callsId: string;
    calls: WalletCall[];
    expiresAt: number;
    chainId: number;
    data: any; // UserOp data from Alchemy
    signatureRequest: {
        data: {
            raw: string;
        };
    };
}

export interface CallsStatus {
    id?: string;
    callsId: string;
    status: 'pending' | 'confirmed' | 'failed';
    transactionHash?: Hash;
    blockNumber?: number;
    gasUsed?: string;
    receipts?: any;
}

export interface WalletCapabilities {
    [chainId: string]: {
        paymasterService?: {
            supported: boolean;
        };
        sessionKeys?: {
            supported: boolean;
        };
        atomicBatch?: {
            supported: boolean;
        };
        auxiliaryFunds?: {
            supported: boolean;
        };
    };
}

export interface SignatureRequest {
    message: string | Hex;
    messageType?: 'text' | 'hex' | 'typedData';
    from?: Address;
}

export interface FormattedSignature {
    signature: Hex;
    messageHash: Hex;
    r: Hex;
    s: Hex;
    v: number;
}

export interface AccountInfo {
    address: Address;
    type: 'EOA' | 'SmartAccount';
    balance?: string;
    nonce?: number;
}

// ===== BUNDLER API ADDITIONAL TYPES =====

export interface MaxPriorityFeeResponse {
    maxPriorityFeePerGas: string;
    chainId: number;
    timestamp: number;
}

// ===== GAS MANAGER API ADDITIONAL TYPES =====

export interface FeePayerRequest {
    userOp: any; // UserOperation type imported from api
    chainId?: number;
}

export interface FeePayerResponse {
    paymasterAddress: Address;
    sponsorshipInfo: {
        policyId: string;
        maxSpend: string;
        expiresAt: number;
    };
}

export interface PaymasterTokenQuote {
    token: Address;
    symbol: string;
    decimals: number;
    exchangeRate: string;
    maxGasCostToken: string;
    maxGasCostUsd: string;
    validUntil: number;
}

export interface PaymasterStubData {
    paymaster: Address;
    paymasterData: Hex;
    paymasterVerificationGasLimit: string;
    paymasterPostOpGasLimit: string;
    validUntil?: number;
}
