import type {SmartAccount} from './SmartAccount';
import {Address} from 'viem';

// ============================================================================
// SMART ACCOUNT SERVICE TYPES
// ============================================================================

export interface SmartAccountResult {
    success: boolean;
    account?: SmartAccount;
    error?: string;
}

export interface CreateSmartAccountParams {
    userId: string;
    email: string;
    chainId?: number;
}

// ============================================================================
// TRANSACTION SERVICE TYPES
// ============================================================================

export interface TransactionRequest {
    to: Address;
    data?: string;
    value?: string | bigint;
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
