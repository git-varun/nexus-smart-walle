import {config} from '../config';
import {
    PimlicoApiResponse,
    PimlicoERC20PaymasterRequest,
    PimlicoERC20PaymasterResponse,
    PimlicoGasPriceResponse,
    PimlicoSponsorUserOperationRequest,
    PimlicoSponsorUserOperationResponse,
    PimlicoTokenQuotesResponse,
    PimlicoUserOperation,
    PimlicoUserOperationEstimate,
    PimlicoUserOperationReceipt,
    PimlicoUserOperationStatus
} from '../types/pimlicoTypes';

// ==================== SIMPLE POC REQUEST FUNCTIONS ====================

/**
 * Simple Pimlico API request following POC patterns
 */
const makePimlicoRequest = async <T>(
    url: string,
    method: string,
    params: any[]
): Promise<T> => {
    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    };

    console.log(`Pimlico ${method}:`, params);

    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Pimlico API Error: ${response.status}`);
    }

    const data = await response.json() as PimlicoApiResponse<T>;
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.result as T;
};

/**
 * Bundler request (v1 API)
 */
const bundlerRequest = async <T>(method: string, params: any[], chainId: number): Promise<T> => {
    const apiKey = config.pimlico.apiKey;
    const url = `https://api.pimlico.io/v1/${chainId}/rpc?apikey=${apiKey}`;
    return makePimlicoRequest<T>(url, method, params);
};

/**
 * Paymaster request (v2 API)
 */
const paymasterRequest = async <T>(method: string, params: any[]): Promise<T> => {
    const chainId = config.alchemy.chainId;
    const apiKey = config.pimlico.apiKey;
    const url = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${apiKey}`;
    return makePimlicoRequest<T>(url, method, params);
};

// ==================== BUNDLER METHODS ====================

/**
 * Estimate user operation gas
 */
export const estimateUserOperationGas = async (
    userOp: Partial<PimlicoUserOperation>,
    entryPoint: string,
    chainId: number
): Promise<PimlicoUserOperationEstimate> => {
    return bundlerRequest('eth_estimateUserOperationGas', [userOp, entryPoint], chainId);
};

/**
 * Send user operation
 */
export const sendUserOperation = async (
    userOp: PimlicoUserOperation,
    entryPoint: string,
    chainId: number,
): Promise<string> => {
    return bundlerRequest('eth_sendUserOperation', [userOp, entryPoint], chainId);
};

/**
 * Get user operation by hash
 */
export const getUserOperationByHash = async (
    userOpHash: string,
    chainId: number,
): Promise<PimlicoUserOperation | null> => {
    return bundlerRequest('eth_getUserOperationByHash', [userOpHash], chainId);
};

/**
 * Get user operation receipt
 */
export const getUserOperationReceipt = async (
    userOpHash: string,
    chainId: number,
): Promise<PimlicoUserOperationReceipt | null> => {
    return bundlerRequest('eth_getUserOperationReceipt', [userOpHash], chainId);
};

/**
 * Get supported entry points
 */
export const getSupportedEntryPoints = async (chainId: number): Promise<string[]> => {
    return bundlerRequest('eth_supportedEntryPoints', [], chainId);
};

/**
 * Get gas prices
 */
export const getUserOperationGasPrice = async (chainId: number): Promise<PimlicoGasPriceResponse> => {
    return bundlerRequest('pimlico_getUserOperationGasPrice', [], chainId);
};

/**
 * Get user operation status
 */
export const getUserOperationStatus = async (
    userOpHash: string,
    chainId: number
): Promise<PimlicoUserOperationStatus> => {
    return bundlerRequest('pimlico_getUserOperationStatus', [userOpHash], chainId);
};

// ==================== PAYMASTER METHODS ====================

/**
 * Sponsor user operation
 */
export const sponsorUserOperation = async (
    request: PimlicoSponsorUserOperationRequest
): Promise<PimlicoSponsorUserOperationResponse> => {
    const params = [
        request.userOperation,
        request.entryPoint,
        request.sponsorshipPolicyId ? {sponsorshipPolicyId: request.sponsorshipPolicyId} : {}
    ];
    return paymasterRequest('pm_sponsorUserOperation', params);
};

/**
 * Get token quotes for ERC-20 paymaster
 */
export const getTokenQuotes = async (
    userOp: Partial<PimlicoUserOperation>,
    entryPoint: string
): Promise<PimlicoTokenQuotesResponse> => {
    return paymasterRequest('pm_getTokenQuotes', [userOp, entryPoint]);
};

/**
 * Get ERC-20 paymaster data
 */
export const getERC20PaymasterData = async (
    request: PimlicoERC20PaymasterRequest
): Promise<PimlicoERC20PaymasterResponse> => {
    const params = [
        request.userOperation,
        request.entryPoint,
        {
            token: request.tokenAddress,
            ...(request.amount && {amount: request.amount})
        }
    ];
    return paymasterRequest('pm_getPaymasterData', params);
};
