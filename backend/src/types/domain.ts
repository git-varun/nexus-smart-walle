// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

// User types
export interface User {
    id: string;
    email?: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface CreateUserInput {
    password: string;
    id?: string;
    email?: string;
}

export interface UpdateUserInput {
    password?: string;
    lastLogin?: Date;
}

// Smart Account types
export interface SmartAccount {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string; // Centralized wallet signer address
    alchemyAccountId?: string; // Alchemy's unique account identifier
    requestId?: string; // Our generated UUID for the request
    salt?: string; // Salt used in account creation
    accountType?: string; // Account type (e.g., "sma-b")
    factoryAddress?: string; // Smart account factory address
    isActive?: boolean; // Account active status
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSmartAccountInput {
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string; // Centralized wallet signer address
    alchemyAccountId?: string; // Alchemy's unique account identifier
    requestId?: string; // Our generated UUID for the request
    salt?: string; // Salt used in account creation
    accountType?: string; // Account type (e.g., "sma-b")
    factoryAddress?: string; // Smart account factory address
    isActive?: boolean; // Account active status
}

export interface UpdateSmartAccountInput {
    isDeployed?: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string;
    alchemyAccountId?: string;
    factoryAddress?: string;
    isActive?: boolean;
}

// Transaction types
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    userId: string;
    smartAccountId: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
    chainId: number;
    gasUsed?: string;
    gasPrice?: string;
    gasLimit?: string;
    blockNumber?: number;
    blockHash?: string;
    transactionIndex?: number;
    aaVersion?: string; // Account Abstraction version used
    error?: string; // Error message if transaction failed
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTransactionInput {
    userId: string;
    smartAccountId: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
    chainId: number;
    gasUsed?: string;
    gasPrice?: string;
    gasLimit?: string;
    aaVersion?: string;
}

export interface UpdateTransactionInput {
    status?: TransactionStatus;
    gasUsed?: string;
    gasPrice?: string;
    gasLimit?: string;
    blockNumber?: number;
    blockHash?: string;
    transactionIndex?: number;
    error?: string;
}

// Session types
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface CreateSessionInput {
    userId: string;
    token: string;
    expiresAt: Date;
}
