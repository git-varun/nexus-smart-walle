import {Address, Hash, Hex} from 'viem';

export interface SmartAccountInfo {
    address: Address;
    isDeployed: boolean;
    nonce: bigint;
    balance?: bigint;
}

export interface TransactionRequest {
    to: Address;
    data?: Hex;
    value?: bigint;
}

export interface TransactionResult {
    hash: Hash;
    userOpHash?: Hash;
    success: boolean;
    receipt?: any;
}

export interface User {
    email?: string;
    userId?: string;
}

export interface SessionKey {
    id: string;
    publicKey: string;
    permissions: string[];
    expiresAt: Date;
    isActive: boolean;
}

export interface RecoveryRequest {
    id: string;
    accountAddress: Address;
    guardians: Address[];
    threshold: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}
