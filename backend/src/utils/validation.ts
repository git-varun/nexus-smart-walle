import type {CreateSmartAccountInput, CreateTransactionInput, CreateUserInput} from '../types';

// ============================================================================
// BASIC VALIDATION FUNCTIONS
// ============================================================================

// Email validation
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Ethereum address validation
export function validateAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
}

// Transaction hash validation (32 bytes = 64 hex characters)
export function validateTransactionHash(hash: string): boolean {
    const hashRegex = /^0x[a-fA-F0-9]{64}$/;
    return hashRegex.test(hash);
}

// Chain ID validation
export function validateChainId(chainId: number): boolean {
    return chainId > 0 && Number.isInteger(chainId);
}

// Session token validation (32+ hex characters)
export function validateSessionToken(token: string): boolean {
    const tokenRegex = /^[a-fA-F0-9]{32,}$/;
    return tokenRegex.test(token);
}

// Transaction status validation
export function validateTransactionStatus(status: string): boolean {
    return ['pending', 'confirmed', 'failed'].includes(status);
}

// Nonce validation
export function validateNonce(nonce: number): boolean {
    return nonce >= 0 && Number.isInteger(nonce);
}

// Date validation helpers
export function isDateInFuture(date: Date): boolean {
    return date > new Date();
}

export function isDateExpired(expirationDate: Date): boolean {
    return expirationDate <= new Date();
}

// ============================================================================
// INPUT VALIDATION FUNCTIONS
// ============================================================================

// User input validation
export function validateUserInput(input: CreateUserInput): string | null {
    if (!input.email) {
        return 'Email is required';
    }

    if (!validateEmail(input.email)) {
        return 'Invalid email format';
    }

    return null; // Valid
}

// Smart account input validation
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

    if (input.nonce !== undefined && !validateNonce(input.nonce)) {
        return 'Nonce must be a non-negative integer';
    }

    return null; // Valid
}

// Transaction input validation
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


