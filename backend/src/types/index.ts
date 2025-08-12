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
    ownerAddress: string;
    email?: string;
}

export interface RecoveryRequest {
    id: string;
    accountAddress: Address;
    guardians: Address[];
    threshold: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

export interface AlchemyServiceConfig {
    apiKey: string;
    policyId?: string;
    chainId: number;
    enableGasManager?: boolean;
}

export interface TransactionHistory {
    id: string;
    hash: Hash;
    userOpHash?: Hash;
    from: Address;
    to: Address;
    value: string;
    data?: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: number;
    gasUsed?: string;
    blockNumber?: number;
    receipt?: any;
}

export interface AuthSession {
    id: string;
    userId: string;
    email?: string;
    eoaAddress?: Address;
    smartAccountAddress?: Address;
    ownerAddress?: Address;
    isAuthenticated: boolean;
    createdAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;
}

export interface AuthenticationParams {
    type: 'email' | 'eoa';
    email?: string;
    eoaAddress?: Address;
    signature?: string;
}

export interface GuardianApproval {
    guardianAddress: Address;
    signature: string;
    timestamp: number;
}

export interface ExtendedRecoveryRequest extends RecoveryRequest {
    approvals: GuardianApproval[];
    newOwner?: Address;
    expiresAt: Date;
}
