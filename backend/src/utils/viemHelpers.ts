import {
    Address,
    Chain,
    ContractFunctionRevertedError,
    createPublicClient,
    formatEther,
    formatUnits,
    getAddress,
    http,
    isAddress,
    keccak256,
    parseEther,
    parseUnits,
    toBytes,
    TransactionReceiptNotFoundError,
    UserRejectedRequestError
} from 'viem';
import {createServiceLogger} from './logger';

const logger = createServiceLogger('ViemHelpers');

// ==================== VALUE FORMATTING & PARSING ====================

/**
 * Format balance from wei to human-readable format
 */
export const formatBalance = (balance: bigint, decimals: number = 18): string => {
    if (decimals === 18) {
        return formatEther(balance);
    }
    return formatUnits(balance, decimals);
};

/**
 * Parse human-readable value to wei
 */
export const parseValue = (value: string, decimals: number = 18): bigint => {
    if (decimals === 18) {
        return parseEther(value);
    }
    return parseUnits(value, decimals);
};

/**
 * Format gas values with proper units
 */
export const formatGasPrice = (gasPrice: bigint): string => {
    const gwei = formatUnits(gasPrice, 9);
    return `${gwei} Gwei`;
};

/**
 * Safe value conversion with validation
 */
export const safeParseValue = (value: string | number | undefined, decimals: number = 18): bigint => {
    if (!value || value === '0') return 0n;

    try {
        const stringValue = typeof value === 'number' ? value.toString() : value;
        return parseValue(stringValue, decimals);
    } catch (error) {
        logger.error('Failed to parse value', error as Error, {value, decimals});
        return 0n;
    }
};

// ==================== ADDRESS UTILITIES ====================

/**
 * Validate Ethereum address
 */
export const validateAddress = (address: string): boolean => {
    return isAddress(address);
};

/**
 * Get checksummed address
 */
export const checksumAddress = (address: string): Address => {
    if (!isAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
    }
    return getAddress(address);
};

/**
 * Safely get checksummed address with error handling
 */
export const safeGetAddress = (address: string): Address | null => {
    try {
        return checksumAddress(address);
    } catch (error) {
        logger.error('Invalid address provided', error as Error, {address});
        return null;
    }
};

// ==================== CRYPTOGRAPHIC UTILITIES ====================

/**
 * Generate deterministic salt from user data
 */
export const generateSalt = (userId: string, chainId: number): string => {
    const saltBuffer = keccak256(toBytes(userId + chainId.toString()));
    return saltBuffer.slice(0, 10); // Use first 8 bytes + 0x prefix = 10 chars
};

/**
 * Hash data using keccak256
 */
export const hashData = (data: string): `0x${string}` => {
    return keccak256(toBytes(data));
};

// ==================== CLIENT UTILITIES ====================

/**
 * Create a configured public client for a specific chain
 */
export const createConfiguredClient = (chain: Chain, rpcUrl?: string) => {
    return createPublicClient({
        chain,
        transport: http(rpcUrl)
    });
};

/**
 * Retry wrapper for blockchain operations
 */
export const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === maxRetries) {
                throw lastError;
            }

            logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
                error: lastError.message,
                attempt
            });

            await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
    }

    throw lastError!;
};

// ==================== ERROR HANDLING ====================

/**
 * Enhanced error handling for blockchain operations
 */
export const handleBlockchainError = (error: unknown): {
    message: string;
    type: 'user_rejected' | 'contract_revert' | 'transaction_not_found' | 'network_error' | 'unknown';
    details?: any;
} => {
    if (error instanceof UserRejectedRequestError) {
        return {
            message: 'Transaction was rejected by user',
            type: 'user_rejected'
        };
    }

    if (error instanceof ContractFunctionRevertedError) {
        return {
            message: `Contract execution reverted: ${error.reason || 'Unknown reason'}`,
            type: 'contract_revert',
            details: {
                reason: error.reason,
                data: error.data
            }
        };
    }

    if (error instanceof TransactionReceiptNotFoundError) {
        return {
            message: 'Transaction receipt not found',
            type: 'transaction_not_found'
        };
    }

    if (error instanceof Error) {
        // Check for common network errors
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return {
                message: 'Network error occurred',
                type: 'network_error',
                details: error.message
            };
        }

        return {
            message: error.message,
            type: 'unknown',
            details: error.stack
        };
    }

    return {
        message: 'An unknown error occurred',
        type: 'unknown',
        details: String(error)
    };
};

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate transaction request data
 */
export const validateTransactionRequest = (request: {
    to: string;
    value?: string;
    data?: string;
}): {
    isValid: boolean;
    errors: string[];
    checksummedTo?: Address;
    parsedValue?: bigint;
} => {
    const errors: string[] = [];
    let checksummedTo: Address | undefined;
    let parsedValue: bigint | undefined;

    // Validate recipient address
    if (!validateAddress(request.to)) {
        errors.push(`Invalid recipient address: ${request.to}`);
    } else {
        checksummedTo = checksumAddress(request.to);
    }

    // Validate value if provided
    if (request.value) {
        try {
            parsedValue = parseEther(request.value);
            if (parsedValue < 0n) {
                errors.push('Value cannot be negative');
            }
        } catch (error) {
            logger.error("Veim Helper", error as Error)
            errors.push(`Invalid value format: ${request.value}`);
        }
    }

    // Validate data if provided
    if (request.data && !request.data.startsWith('0x')) {
        errors.push('Transaction data must be hex string starting with 0x');
    }

    return {
        isValid: errors.length === 0,
        errors,
        checksummedTo,
        parsedValue
    };
};

// ==================== GAS UTILITIES ====================

/**
 * Calculate optimal gas price based on network conditions
 */
export const calculateOptimalGasPrice = (
    baseFee: bigint,
    priorityFee: bigint,
    speed: 'slow' | 'standard' | 'fast' = 'standard'
): { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } => {
    const multipliers = {
        slow: {base: 1.1, priority: 1.0},
        standard: {base: 1.2, priority: 1.1},
        fast: {base: 1.5, priority: 1.3}
    };

    const multiplier = multipliers[speed];

    return {
        maxFeePerGas: baseFee + (priorityFee * BigInt(Math.floor(multiplier.base * 100))) / 100n,
        maxPriorityFeePerGas: (priorityFee * BigInt(Math.floor(multiplier.priority * 100))) / 100n
    };
};

// ==================== LOGGING UTILITIES ====================

/**
 * Log transaction details in a standardized format
 */
export const logTransaction = (
    action: string,
    details: {
        userId?: string;
        chainId?: number;
        to?: string;
        value?: string;
        gasLimit?: string;
        gasPrice?: string;
        hash?: string;
        [key: string]: any;
    }
) => {
    logger.info(`Transaction ${action}`, {
        ...details,
        formattedValue: details.value ? formatBalance(BigInt(details.value)) : undefined,
        formattedGasPrice: details.gasPrice ? formatGasPrice(BigInt(details.gasPrice)) : undefined
    });
};

// ==================== TYPE GUARDS ====================

/**
 * Check if a value is a valid hex string
 */
export const isHexString = (value: string): value is `0x${string}` => {
    return /^0x[0-9a-fA-F]*$/.test(value);
};

/**
 * Check if a value is a valid private key
 */
export const isValidPrivateKey = (privateKey: string): privateKey is `0x${string}` => {
    return isHexString(privateKey) && privateKey.length === 66; // 0x + 64 hex chars
};
