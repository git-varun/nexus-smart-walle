import {Request} from 'express';
import {Address, Hash, Hex} from 'viem';
import {SmartAccount, User} from './domain';

// ============================================================================
// API & SERVICE TYPES
// ============================================================================

// Authentication types
export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    smartAccountAddress?: string;
    error?: string;
}

export interface SessionValidationResult {
    success: boolean;
    user?: User;
    error?: string;
}

export interface AuthStatusResult {
    success: boolean;
    authenticated: boolean;
    user?: User;
    smartAccountAddress?: string;
    alchemyStatus?: boolean;
    error?: string;
}

export interface AuthenticateUserParams {
    userId: string;
}

// Middleware types
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
    session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
    };
}

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}

// Service result types
export interface SmartAccountResult {
    success: boolean;
    account?: SmartAccount;
    error?: string;
}

export interface CreateSmartAccountParams {
    userId: string;
    chainId?: number;
}

export interface TransactionRequest {
    to: Address;
    data?: Hex;
    value?: string | bigint;
    version?: AAVersion; // Optional AA version preference
}

export interface TransactionInfo {
    id: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    gasPrice?: string;
    gasLimit?: string;
    blockNumber?: number;
    blockHash?: string;
    transactionIndex?: number;
    aaVersion?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionResult {
    success: boolean;
    transaction?: TransactionInfo;
    error?: string;
}

export interface TransactionHistoryResult {
    success: boolean;
    transactions?: TransactionInfo[];
    error?: string;
}

export interface GasEstimate {
    gasLimit: string;
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    preVerificationGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
    totalCostWei: string;
    totalCostEth: string;
    aaVersion: AAVersion;
}

export interface GasEstimationResult {
    success: boolean;
    gasEstimate?: GasEstimate;
    error?: string;
}

// Alchemy service types
export interface AlchemyConfig {
    apiKey: string;
    policyId?: string;
    chainId?: number;
}

export interface AlchemySmartAccount {
    id?: string;
    userId?: string;
    address: Address;
    chainId?: number;
    isDeployed: boolean;
    nonce: bigint | number;
    balance?: bigint;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AlchemyTransaction {
    to: Address;
    data?: Hex;
    value?: bigint;
}

export interface AlchemyTransactionResult {
    hash: Hash;
    userOpHash?: Hash;
    success: boolean;
}

export interface AlchemyUser {
    id?: string;
    email?: string;
    userId?: string;
    createdAt?: Date;
}

// Account Abstraction version enum
export type AAVersion = '0.6' | '0.7';

// UserOperation for AA v0.6 (current/legacy format)
export interface UserOperationV06 {
    sender: Address;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string;
    signature: string;
}

// UserOperation for AA v0.7 (new packed format)
export interface UserOperationV07 {
    sender: Address;
    nonce: string;
    factory?: string;           // Replaces initCode (first 20 bytes)
    factoryData?: string;       // Replaces initCode (remaining bytes)
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymaster?: string;                    // Replaces paymasterAndData (first 20 bytes)
    paymasterData?: string;                // Replaces paymasterAndData (remaining bytes)
    paymasterVerificationGasLimit?: string; // New in v0.7
    paymasterPostOpGasLimit?: string;      // New in v0.7
    signature: string;
}

// Union type for backward compatibility
export type UserOperation = UserOperationV06 | UserOperationV07;

export interface AlchemyServiceInstance {
    publicClient: any;
    bundlerUrl: string;
    paymasterUrl: string;
    currentUser: AlchemyUser | null;
    smartAccountAddress: Address | null;
}
