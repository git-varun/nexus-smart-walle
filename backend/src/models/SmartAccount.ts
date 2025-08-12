export interface SmartAccount {
    id: string;
    userId: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
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

// Simple validation helpers
export function validateAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
}

export function validateChainId(chainId: number): boolean {
    return chainId > 0 && Number.isInteger(chainId);
}

export function validateSmartAccountInput(input: CreateSmartAccountInput): string | null {
    if (!input.userId) {
        return 'User ID is required';
    }

    if (!input.address) {
        return 'Address is required';
    }

    if (!validateAddress(input.address)) {
        return 'Invalid address format';
    }

    if (!validateChainId(input.chainId)) {
        return 'Invalid chain ID';
    }

    if (input.nonce !== undefined && (input.nonce < 0 || !Number.isInteger(input.nonce))) {
        return 'Nonce must be a non-negative integer';
    }

    return null; // Valid
}
