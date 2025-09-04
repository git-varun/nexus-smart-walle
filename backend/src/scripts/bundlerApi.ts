import {config} from '../config';
import {
    GasEstimate,
    MaxPriorityFeeResponse,
    SimulationResult,
    UserOperation,
    UserOpReceipt,
    UserOpResult,
    UserOpStatus
} from '../types/alchemyTypes';

const TIMEOUT = 10000;

/**
 * Simple bundler API request - no retry logic for POC
 */
const makeBundlerRequest = async <T>(
    method: string,
    params: any[]
): Promise<T> => {
    const baseUrl = `https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`;

    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    };

    console.log(`Making ${method} request`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();

        if (data.error) {
            throw new Error(`Bundler API Error: ${data.error.message}`);
        }

        return data.result;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`${method} failed:`, error);
        throw error;
    }
};

/**
 * Send UserOperation to the bundler
 */
export const sendUserOperation = async (
    userOp: UserOperation
): Promise<UserOpResult> => {
    try {
        const entryPoint = config.alchemy.entryPointV06;
        console.log('Sending UserOperation:', userOp.sender);

        const userOpHash = await makeBundlerRequest<string>(
            'eth_sendUserOperation',
            [userOp, entryPoint]
        );

        return {
            userOpHash: userOpHash as `0x${string}`,
            success: true
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            userOpHash: '0x' as `0x${string}`,
            success: false,
            error: errorMessage
        };
    }
};

export const getUserOperationByHash = async (
    userOpHash: string
): Promise<UserOpStatus | null> => {
    console.log('Getting UserOperation by hash:', userOpHash);
    return await makeBundlerRequest<UserOpStatus | null>(
        'eth_getUserOperationByHash',
        [userOpHash]
    );
};

export const getUserOperationReceipt = async (
    userOpHash: string
): Promise<UserOpReceipt | null> => {
    console.log('Getting UserOperation receipt:', userOpHash);
    return await makeBundlerRequest<UserOpReceipt | null>(
        'eth_getUserOperationReceipt',
        [userOpHash]
    );
};

export const estimateUserOperationGas = async (
    userOp: UserOperation
): Promise<GasEstimate> => {
    const entryPoint = config.alchemy.entryPointV06;
    console.log('Estimating UserOperation gas:', userOp.sender);

    return await makeBundlerRequest<GasEstimate>(
        'eth_estimateUserOperationGas',
        [userOp, entryPoint]
    );
};

export const simulateUserOperation = async (
    userOp: UserOperation
): Promise<SimulationResult> => {
    const entryPoint = config.alchemy.entryPointV06;
    console.log('Simulating UserOperation:', userOp.sender);

    return await makeBundlerRequest<SimulationResult>(
        'eth_simulateUserOperation',
        [userOp, entryPoint]
    );
};

export const getSupportedEntryPoints = async (): Promise<string[]> => {
    return await makeBundlerRequest<string[]>('eth_supportedEntryPoints', []);
};

export const getChainId = async (): Promise<number> => {
    const result = await makeBundlerRequest<string>('eth_chainId', []);
    return parseInt(result, 16);
};

export const rundler_maxPriorityFeePerGas = async (): Promise<MaxPriorityFeeResponse> => {
    return await makeBundlerRequest<MaxPriorityFeeResponse>('rundler_maxPriorityFeePerGas', []);
};
