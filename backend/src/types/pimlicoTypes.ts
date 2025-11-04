// Pimlico API Types for Bundler and Paymaster integration
// Following ERC-4337 standards with Pimlico-specific extensions

// ==================== COMMON TYPES ====================

export interface PimlicoApiResponse<T = any> {
    jsonrpc: '2.0';
    id: number | string;
    result?: T;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}


// ==================== BUNDLER TYPES ====================

export interface PimlicoUserOperation {
    sender: string;
    nonce: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    factory?: string;
    factoryData?: string;
    paymaster?: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
    paymasterData?: string;
    signature: string;
}

export interface PimlicoUserOperationEstimate {
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    paymasterVerificationGasLimit?: string;
    paymasterPostOpGasLimit?: string;
}

export interface PimlicoUserOperationReceipt {
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

export interface PimlicoUserOperationStatus {
    status: 'not_found' | 'not_submitted' | 'submitted' | 'rejected' | 'reverted' | 'included' | 'failed';
    transactionHash?: string;
    blockNumber?: number;
    blockHash?: string;
    actualGasCost?: string;
    actualGasUsed?: string;
    reason?: string;
    submittedAt?: number;
}

export interface PimlicoGasPriceResponse {
    slow: {
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    };
    standard: {
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    };
    fast: {
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
    };
}

// ==================== PAYMASTER TYPES ====================

export interface PimlicoSponsorUserOperationRequest {
    userOperation: Partial<PimlicoUserOperation>;
    entryPoint: string;
    sponsorshipPolicyId?: string;
}

export interface PimlicoSponsorUserOperationResponse {
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

// ERC-20 Paymaster Types
export interface PimlicoERC20PaymasterRequest {
    userOperation: Partial<PimlicoUserOperation>;
    entryPoint: string;
    tokenAddress: string;
    amount?: string;
}

export interface PimlicoTokenQuote {
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenPrice: string;
    maxGasCost: string;
    exchangeRate: string;
    refundReceiver?: string;
}

export interface PimlicoTokenQuotesResponse {
    quotes: PimlicoTokenQuote[];
    timestamp: number;
    validFor: number; // seconds
}

export interface PimlicoERC20PaymasterResponse {
    paymaster: string;
    paymasterData: string;
    paymasterVerificationGasLimit: string;
    paymasterPostOpGasLimit: string;
    tokenQuote: PimlicoTokenQuote;
    approvalData?: {
        to: string;
        data: string;
        value: string;
    };
}
