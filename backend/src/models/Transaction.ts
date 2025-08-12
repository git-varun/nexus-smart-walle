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
    gasUsed?: string;
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
}

export interface UpdateTransactionInput {
    status?: TransactionStatus;
    gasUsed?: string;
}

// Simple validation helpers
export function validateTransactionHash(hash: string): boolean {
    const hashRegex = /^0x[a-fA-F0-9]{64}$/;
    return hashRegex.test(hash);
}

export function validateAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
}

export function validateTransactionStatus(status: string): status is TransactionStatus {
    return ['pending', 'confirmed', 'failed'].includes(status);
}

export function validateTransactionInput(input: CreateTransactionInput): string | null {
    if (!input.userId) {
        return 'User ID is required';
    }

    if (!input.smartAccountId) {
        return 'Smart Account ID is required';
    }

    if (!input.hash) {
        return 'Transaction hash is required';
    }

    if (!validateTransactionHash(input.hash)) {
        return 'Invalid transaction hash format';
    }

    if (!input.to) {
        return 'Recipient address is required';
    }

    if (!validateAddress(input.to)) {
        return 'Invalid recipient address format';
    }

    if (!validateTransactionStatus(input.status)) {
        return 'Invalid transaction status';
    }

    if (input.userOpHash && !validateTransactionHash(input.userOpHash)) {
        return 'Invalid user operation hash format';
    }

    return null; // Valid
}
