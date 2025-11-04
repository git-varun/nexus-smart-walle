// Smart Account domain types
export interface SmartAccount {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string;
    alchemyAccountId?: string;
    requestId?: string;
    salt?: string;
    accountType?: string;
    factoryAddress?: string;
    isActive?: boolean;
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
}

export interface UpdateSmartAccountInput {
    isDeployed?: boolean;
    balance?: string;
    nonce?: number;
}