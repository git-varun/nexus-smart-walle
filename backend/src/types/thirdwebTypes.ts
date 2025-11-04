// Thirdweb API Types for Wallet, Bundler, and Paymaster integration

// ==================== COMMON TYPES ====================

export interface ThirdwebApiResponse<T = any> {
    jsonrpc: '2.0';
    id: number | string;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export interface ThirdwebRequestOptions {
    timeout?: number;
    retries?: number;
}

// ==================== WALLET TYPES ====================

export interface WalletInfo {
    address: string;
    chainId: number;
    isDeployed: boolean;
    factory?: string;
    implementation?: string;
}

export interface CreateWalletRequest {
    personalSign: string;
}

export interface CreateWalletResponse {
    walletAddress: string;
    deviceShareStored: string;
    isNewUser: boolean;
    needsRecovery: boolean;
}

export interface SignMessageRequest {
    message: string;
    isBytes?: boolean;
}

export interface SignMessageResponse {
    signature: string;
}

export interface SignTransactionRequest {
    transaction: {
        to: string;
        value?: string;
        data?: string;
        gasLimit?: string;
    };
}

export interface SignTransactionResponse {
    signature: string;
    serializedTransaction?: string;
}

export interface SessionKeyRequest {
    keyAddress: string;
    permissions: SessionPermissions[];
    validityPeriod: {
        validAfter: number;
        validUntil: number;
    };
}

export interface SessionPermissions {
    target: string;
    valueLimit: string;
    sig: string;
}

export interface SessionKeyResponse {
    sessionKeyAddress: string;
    isActive: boolean;
    permissions: SessionPermissions[];
    validAfter: number;
    validUntil: number;
}

// ==================== BUNDLER TYPES ====================

export interface UserOperation {
    sender: string;
    nonce: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymaster?: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
    paymasterData?: string;
    signature: string;
}

export interface UserOperationEstimate {
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
}

export interface UserOperationReceipt {
    userOpHash: string;
    entryPoint: string;
    sender: string;
    nonce: string;
    paymaster?: string;
    actualGasCost: string;
    actualGasUsed: string;
    success: boolean;
    logs: any[];
    receipt: {
        transactionHash: string;
        blockNumber: number;
        blockHash: string;
        gasUsed: string;
    };
}

export interface UserOperationStatus {
    status: 'pending' | 'included' | 'failed' | 'rejected';
    transactionHash?: string;
    blockNumber?: number;
    actualGasCost?: string;
    reason?: string;
}

export interface BundlerChainInfo {
    chainId: string;
    entryPoints: string[];
}

export interface GasPriceResponse {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
}

// ==================== PAYMASTER TYPES ====================

export interface PaymasterRequest {
    userOp: Partial<UserOperation>;
    entryPoint: string;
    chainId: number;
}

export interface PaymasterResponse {
    paymaster: string;
    paymasterData: string;
    paymasterVerificationGasLimit: string;
    paymasterPostOpGasLimit: string;
    preVerificationGas?: string;
    verificationGasLimit?: string;
    callGasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

export interface SponsorshipPolicy {
    id: string;
    name: string;
    rules: PolicyRule[];
    isActive: boolean;
    usageLimit?: {
        maxTransactions: number;
        maxAmount: string;
        period: 'daily' | 'weekly' | 'monthly';
    };
    whitelist?: string[];
    blacklist?: string[];
}

export interface PolicyRule {
    type: 'contract' | 'value' | 'gas' | 'frequency';
    condition: string;
    value: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
}

export interface SponsorshipEligibility {
    eligible: boolean;
    reason?: string;
    estimatedCost?: string;
    policyId?: string;
}

export interface PaymasterUsage {
    totalTransactions: number;
    totalGasSpent: string;
    totalValueSponsored: string;
    period: {
        from: string;
        to: string;
    };
    breakdown: {
        successful: number;
        failed: number;
        averageGasPrice: string;
    };
}

// ==================== EIP-7702 DELEGATION TYPES ====================

export interface DelegationInfo {
    delegatedTo: string;
    nonce: string;
    isActive: boolean;
    validUntil?: number;
}

export interface SetDelegationRequest {
    implementation: string;
    validUntil?: number;
    signature?: string;
}

export interface DelegatedCallRequest {
    calls: {
        to: string;
        value: string;
        data: string;
    }[];
    delegationInfo: DelegationInfo;
}

// ==================== ZKSYNC SPECIFIC TYPES ====================

export interface ZkSyncPaymasterRequest {
    userOp: Partial<UserOperation>;
    paymasterInput?: string;
}

export interface ZkSyncPaymasterResponse {
    paymasterInput: string;
    gasLimit: string;
    gasPerPubdataLimit: string;
}

export interface ZkSyncAccountInfo {
    address: string;
    nonce: number;
    balance: string;
    codeHash?: string;
    factoryDeps?: string[];
}

// ==================== ANALYTICS TYPES ====================

export interface TransactionAnalytics {
    totalTransactions: number;
    successRate: number;
    averageGasPrice: string;
    totalGasUsed: string;
    costBreakdown: {
        userPaid: string;
        sponsored: string;
        total: string;
    };
    timeRange: {
        from: string;
        to: string;
    };
}

export interface GasOptimizationSuggestion {
    type: 'bundler' | 'timing' | 'batching' | 'route';
    description: string;
    potentialSavings: string;
    confidence: 'low' | 'medium' | 'high';
}

// ==================== ERROR TYPES ====================

export interface ThirdwebError {
    code: number;
    message: string;
    details?: {
        method?: string;
        params?: any;
        timestamp?: string;
    };
}

export interface ValidationError extends ThirdwebError {
    field: string;
    expectedType: string;
    receivedValue: any;
}

// ==================== CONFIGURATION TYPES ====================

export interface ThirdwebConfig {
    clientId: string;
    secretKey: string;
    bundler: {
        url: string;
        version: string;
    };
    paymaster: {
        url: string;
        policyId?: string;
    };
    wallet: {
        url: string;
    };
    chains: {
        [chainId: number]: {
            name: string;
            bundlerUrl: string;
        };
    };
}

// ==================== REQUEST/RESPONSE WRAPPERS ====================

export interface ThirdwebMethodRequest<T = any> {
    method: string;
    params: T;
    options?: ThirdwebRequestOptions;
}

export interface ThirdwebBatchRequest {
    requests: ThirdwebMethodRequest[];
    stopOnError?: boolean;
}

export interface ThirdwebBatchResponse<T = any> {
    results: (T | ThirdwebError)[];
    errors: ThirdwebError[];
}