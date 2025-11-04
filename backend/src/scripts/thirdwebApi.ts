import {config} from '../config';
import {
    CreateWalletRequest,
    CreateWalletResponse,
    DelegatedCallRequest,
    DelegationInfo,
    GasOptimizationSuggestion,
    GasPriceResponse,
    PaymasterRequest,
    PaymasterResponse,
    PaymasterUsage,
    SessionKeyRequest,
    SessionKeyResponse,
    SetDelegationRequest,
    SignMessageRequest,
    SignMessageResponse,
    SignTransactionRequest,
    SignTransactionResponse,
    SponsorshipEligibility,
    SponsorshipPolicy,
    ThirdwebApiResponse,
    ThirdwebRequestOptions,
    TransactionAnalytics,
    UserOperation,
    UserOperationEstimate,
    UserOperationReceipt,
    WalletInfo,
    ZkSyncAccountInfo,
    ZkSyncPaymasterRequest,
    ZkSyncPaymasterResponse
} from '../types/thirdwebTypes';

const TIMEOUT = 10000;

// ==================== CORE REQUEST INFRASTRUCTURE ====================

/**
 * Base request function for thirdweb API calls
 * Handles authentication, timeouts, and error handling following POC patterns
 */
export const makeThirdwebRequest = async <T>(
    url: string,
    method: string,
    params: any[] | Record<string, any>,
    options: ThirdwebRequestOptions = {}
): Promise<T> => {
    const timeout = options.timeout || TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const isJsonRpc = Array.isArray(params);

    const requestBody = isJsonRpc ? {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    } : params;

    console.log(`Making third web ${method} request`);

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Add thirdweb authentication headers
        if (config.thirdweb.clientId) {
            headers['x-client-id'] = config.thirdweb.clientId;
        }
        if (config.thirdweb.secretKey) {
            headers['x-secret-key'] = config.thirdweb.secretKey;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (isJsonRpc) {
            const apiResponse = data as ThirdwebApiResponse<T>;
            if (apiResponse.error) {
                throw new Error(`Third web API Error: ${apiResponse.error.message}`);
            }
            return apiResponse.result!;
        }

        return data as T;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }

        throw new Error(`Request failed: ${String(error)}`);
    }
};

/**
 * Make bundler-specific requests (JSON-RPC format)
 */
const makeBundlerRequest = async <T>(method: string, params: any[]): Promise<T> => {
    const chainId = config.alchemy.chainId;
    const chainConfig = (config.thirdweb.chains as Record<number, { name: string; bundlerUrl: string }>)[chainId];

    if (!chainConfig) {
        throw new Error(`Chain ${chainId} not supported by third web bundler`);
    }

    const url = chainConfig.bundlerUrl;
    return makeThirdwebRequest<T>(url, method, params);
};

/**
 * Make paymaster-specific requests
 */
const makePaymasterRequest = async <T>(method: string, params: any[]): Promise<T> => {
    return makeThirdwebRequest<T>(config.thirdweb.paymaster.url, method, params);
};

/**
 * Make wallet-specific requests (REST format)
 */
const makeWalletRequest = async <T>(endpoint: string, data: Record<string, any>): Promise<T> => {
    const url = `${config.thirdweb.wallet.url}${endpoint}`;
    return makeThirdwebRequest<T>(url, endpoint, data);
};

// ==================== WALLET METHODS ====================

/**
 * Create a new thirdweb embedded wallet
 */
export const createWallet = async (request: CreateWalletRequest): Promise<CreateWalletResponse> => {
    console.log('Creating thirdweb embedded wallet');
    return await makeWalletRequest<CreateWalletResponse>('/api/2023-11-30/embedded-wallet/create', {
        personalSign: request.personalSign
    });
};

/**
 * Get wallet information
 */
export const getWalletInfo = async (address: string): Promise<WalletInfo> => {
    console.log('Getting wallet info for:', address);
    return await makeWalletRequest<WalletInfo>('/api/2023-11-30/embedded-wallet/user-details', {
        queryBy: 'walletAddress',
        walletAddress: address
    });
};

/**
 * Sign message with thirdweb wallet
 */
export const signMessage = async (request: SignMessageRequest): Promise<SignMessageResponse> => {
    console.log('Signing message with thirdweb wallet');
    return await makeWalletRequest<SignMessageResponse>('/api/2023-11-30/embedded-wallet/sign-message', {
        message: request.message,
        isBytes: request.isBytes || false
    });
};

/**
 * Sign transaction with thirdweb wallet
 */
export const signTransaction = async (request: SignTransactionRequest): Promise<SignTransactionResponse> => {
    console.log('Signing transaction with thirdweb wallet');
    return await makeWalletRequest<SignTransactionResponse>('/api/2023-11-30/embedded-wallet/sign-transaction', {
        transaction: request.transaction
    });
};

/**
 * Create session key for wallet
 */
export const createSessionKey = async (request: SessionKeyRequest): Promise<SessionKeyResponse> => {
    console.log('Creating session key');
    return await makeWalletRequest<SessionKeyResponse>('/api/2023-11-30/embedded-wallet/create-session', {
        keyAddress: request.keyAddress,
        permissions: request.permissions,
        validityPeriod: request.validityPeriod
    });
};

/**
 * List active session keys
 */
export const listSessionKeys = async (walletAddress: string): Promise<SessionKeyResponse[]> => {
    console.log('Listing session keys for wallet:', walletAddress);
    return await makeWalletRequest<SessionKeyResponse[]>('/api/2023-11-30/embedded-wallet/list-sessions', {
        walletAddress
    });
};

/**
 * Revoke session key
 */
export const revokeSessionKey = async (sessionKeyAddress: string): Promise<{ success: boolean }> => {
    console.log('Revoking session key:', sessionKeyAddress);
    return await makeWalletRequest<{ success: boolean }>('/api/2023-11-30/embedded-wallet/revoke-session', {
        sessionKeyAddress
    });
};

// ==================== BUNDLER METHODS ====================

/**
 * Estimate gas for user operation
 */
export const estimateUserOperationGas = async (userOp: Partial<UserOperation>, entryPoint: string): Promise<UserOperationEstimate> => {
    console.log('Estimating user operation gas');
    return await makeBundlerRequest<UserOperationEstimate>('eth_estimateUserOperationGas', [userOp, entryPoint]);
};

/**
 * Send user operation to bundler
 */
export const sendUserOperation = async (userOp: UserOperation, entryPoint: string): Promise<string> => {
    console.log('Sending user operation');
    return await makeBundlerRequest<string>('eth_sendUserOperation', [userOp, entryPoint]);
};

/**
 * Get user operation status by hash
 */
export const getUserOperationByHash = async (userOpHash: string): Promise<UserOperation | null> => {
    console.log('Getting user operation by hash:', userOpHash);
    return await makeBundlerRequest<UserOperation | null>('eth_getUserOperationByHash', [userOpHash]);
};

/**
 * Get user operation receipt
 */
export const getUserOperationReceipt = async (userOpHash: string): Promise<UserOperationReceipt | null> => {
    console.log('Getting user operation receipt:', userOpHash);
    return await makeBundlerRequest<UserOperationReceipt | null>('eth_getUserOperationReceipt', [userOpHash]);
};

/**
 * Get supported entry points
 */
export const getSupportedEntryPoints = async (): Promise<string[]> => {
    console.log('Getting supported entry points');
    return await makeBundlerRequest<string[]>('eth_supportedEntryPoints', []);
};

/**
 * Get chain ID from bundler
 */
export const getChainId = async (): Promise<string> => {
    console.log('Getting chain ID from bundler');
    return await makeBundlerRequest<string>('eth_chainId', []);
};

/**
 * Get recommended gas prices
 */
export const getGasPrices = async (): Promise<GasPriceResponse> => {
    console.log('Getting recommended gas prices');
    return await makeBundlerRequest<GasPriceResponse>('rundler_maxPriorityFeePerGas', []);
};

/**
 * Simulate user operation (debugging)
 */
export const simulateUserOperation = async (userOp: UserOperation, entryPoint: string): Promise<any> => {
    console.log('Simulating user operation');
    return await makeBundlerRequest('eth_simulateUserOperation', [userOp, entryPoint]);
};

// ==================== BUNDLER ENTRYPOINT V0.7 METHODS ====================

/**
 * Estimate gas for user operation (EntryPoint v0.7)
 */
export const estimateUserOperationGasV07 = async (userOp: Partial<UserOperation>, entryPoint: string): Promise<UserOperationEstimate> => {
    console.log('Estimating user operation gas (v0.7)');
    return await makeBundlerRequest<UserOperationEstimate>('eth_estimateUserOperationGas', [userOp, entryPoint]);
};

/**
 * Send user operation (EntryPoint v0.7)
 */
export const sendUserOperationV07 = async (userOp: UserOperation, entryPoint: string): Promise<string> => {
    console.log('Sending user operation (v0.7)');
    return await makeBundlerRequest<string>('eth_sendUserOperation', [userOp, entryPoint]);
};

// ==================== PAYMASTER METHODS ====================

/**
 * Sponsor user operation with paymaster
 */
export const sponsorUserOperation = async (request: PaymasterRequest): Promise<PaymasterResponse> => {
    console.log('Sponsoring user operation');
    return await makePaymasterRequest<PaymasterResponse>('pm_sponsorUserOperation', [{
        ...request.userOp,
        chainId: request.chainId
    }, request.entryPoint]);
};

/**
 * Get paymaster data for user operation
 */
export const getPaymasterData = async (request: PaymasterRequest): Promise<PaymasterResponse> => {
    console.log('Getting paymaster data');
    return await makePaymasterRequest<PaymasterResponse>('pm_getPaymasterData', [{
        ...request.userOp,
        chainId: request.chainId
    }, request.entryPoint]);
};

/**
 * Check sponsorship eligibility
 */
export const checkSponsorshipEligibility = async (
    userOp: Partial<UserOperation>,
    policyId?: string
): Promise<SponsorshipEligibility> => {
    console.log('Checking sponsorship eligibility');
    return await makePaymasterRequest<SponsorshipEligibility>('pm_checkEligibility', [
        userOp,
        policyId || config.thirdweb.paymaster.policyId
    ]);
};

/**
 * Get paymaster usage analytics
 */
export const getPaymasterUsage = async (
    timeRange: { from: string; to: string },
    policyId?: string
): Promise<PaymasterUsage> => {
    console.log('Getting paymaster usage analytics');
    return await makePaymasterRequest<PaymasterUsage>('pm_getUsage', [
        timeRange,
        policyId || config.thirdweb.paymaster.policyId
    ]);
};

// ==================== POLICY MANAGEMENT METHODS ====================

/**
 * Create sponsorship policy
 */
export const createSponsorshipPolicy = async (policy: Omit<SponsorshipPolicy, 'id'>): Promise<SponsorshipPolicy> => {
    console.log('Creating sponsorship policy');
    return await makePaymasterRequest<SponsorshipPolicy>('pm_createPolicy', [policy]);
};

/**
 * Update sponsorship policy
 */
export const updateSponsorshipPolicy = async (policyId: string, updates: Partial<SponsorshipPolicy>): Promise<SponsorshipPolicy> => {
    console.log('Updating sponsorship policy:', policyId);
    return await makePaymasterRequest<SponsorshipPolicy>('pm_updatePolicy', [policyId, updates]);
};

/**
 * Delete sponsorship policy
 */
export const deleteSponsorshipPolicy = async (policyId: string): Promise<{ success: boolean }> => {
    console.log('Deleting sponsorship policy:', policyId);
    return await makePaymasterRequest<{ success: boolean }>('pm_deletePolicy', [policyId]);
};

/**
 * List sponsorship policies
 */
export const listSponsorshipPolicies = async (): Promise<SponsorshipPolicy[]> => {
    console.log('Listing sponsorship policies');
    return await makePaymasterRequest<SponsorshipPolicy[]>('pm_listPolicies', []);
};

// ==================== EIP-7702 DELEGATION METHODS ====================

/**
 * Set delegation for account (EIP-7702)
 */
export const setDelegation = async (request: SetDelegationRequest): Promise<DelegationInfo> => {
    console.log('Setting delegation (EIP-7702)');
    return await makeBundlerRequest<DelegationInfo>('eth_setDelegation', [{
        implementation: request.implementation,
        validUntil: request.validUntil,
        signature: request.signature
    }]);
};

/**
 * Get delegation info
 */
export const getDelegationInfo = async (address: string): Promise<DelegationInfo | null> => {
    console.log('Getting delegation info for:', address);
    return await makeBundlerRequest<DelegationInfo | null>('eth_getDelegation', [address]);
};

/**
 * Execute delegated calls
 */
export const executeDelegatedCalls = async (request: DelegatedCallRequest): Promise<string[]> => {
    console.log('Executing delegated calls');
    return await makeBundlerRequest<string[]>('eth_executeDelegatedCalls', [
        request.calls,
        request.delegationInfo
    ]);
};

// ==================== ZKSYNC SPECIFIC METHODS ====================

/**
 * Get zkSync paymaster data
 */
export const getZkSyncPaymasterData = async (request: ZkSyncPaymasterRequest): Promise<ZkSyncPaymasterResponse> => {
    console.log('Getting zkSync paymaster data');
    const zkSyncUrl = 'https://zksync.bundler.thirdweb.com/v2';
    return await makeThirdwebRequest<ZkSyncPaymasterResponse>(
        zkSyncUrl,
        'zks_getPaymasterParams',
        [request.userOp, request.paymasterInput]
    );
};

/**
 * Get zkSync account info
 */
export const getZkSyncAccountInfo = async (address: string): Promise<ZkSyncAccountInfo> => {
    console.log('Getting zkSync account info for:', address);
    const zkSyncUrl = 'https://zksync.bundler.thirdweb.com/v2';
    return await makeThirdwebRequest<ZkSyncAccountInfo>(
        zkSyncUrl,
        'zks_getAccountInfo',
        [address]
    );
};

// ==================== ANALYTICS METHODS ====================

/**
 * Get transaction analytics
 */
export const getTransactionAnalytics = async (
    timeRange: { from: string; to: string },
    address?: string
): Promise<TransactionAnalytics> => {
    console.log('Getting transaction analytics');
    return await makePaymasterRequest<TransactionAnalytics>('analytics_getTransactionStats', [
        timeRange,
        address
    ]);
};

/**
 * Get gas optimization suggestions
 */
export const getGasOptimizationSuggestions = async (
    address: string,
    recentTxCount = 10
): Promise<GasOptimizationSuggestion[]> => {
    console.log('Getting gas optimization suggestions');
    return await makePaymasterRequest<GasOptimizationSuggestion[]>('analytics_getOptimizationSuggestions', [
        address,
        recentTxCount
    ]);
};

// ==================== BATCH OPERATIONS ====================

/**
 * Execute multiple bundler requests in parallel
 */
export const batchBundlerRequests = async <T>(
    requests: Array<{ method: string; params: any[] }>
): Promise<T[]> => {
    console.log('Executing batch bundler requests');

    const promises = requests.map(({method, params}) =>
        makeBundlerRequest<T>(method, params)
    );

    return await Promise.all(promises);
};

/**
 * Execute multiple paymaster requests in parallel
 */
export const batchPaymasterRequests = async <T>(
    requests: Array<{ method: string; params: any[] }>
): Promise<T[]> => {
    console.log('Executing batch paymaster requests');

    const promises = requests.map(({method, params}) =>
        makePaymasterRequest<T>(method, params)
    );

    return await Promise.all(promises);
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Test thirdweb connection and capabilities
 */
export const testThirdwebConnection = async (): Promise<{
    bundler: boolean;
    paymaster: boolean;
    wallet: boolean;
    chains: string[];
}> => {
    console.log('Testing thirdweb connection');

    const results = {
        bundler: false,
        paymaster: false,
        wallet: false,
        chains: [] as string[]
    };

    try {
        // Test bundler
        await getSupportedEntryPoints();
        results.bundler = true;
    } catch (error) {
        console.warn('Bundler connection failed:', error);
    }

    try {
        // Test paymaster
        await listSponsorshipPolicies();
        results.paymaster = true;
    } catch (error) {
        console.warn('Paymaster connection failed:', error);
    }

    try {
        // Test wallet (this might need adjustment based on actual API)
        results.wallet = !!(config.thirdweb.clientId && config.thirdweb.secretKey);
    } catch (error) {
        console.warn('Wallet connection failed:', error);
    }

    results.chains = Object.keys(config.thirdweb.chains);

    return results;
};

/**
 * Get optimal bundler for a given chain
 */
export const getOptimalBundler = async (chainId: number): Promise<string> => {
    const chainConfig = (config.thirdweb.chains as Record<number, { name: string; bundlerUrl: string }>)[chainId];
    if (!chainConfig) {
        throw new Error(`Unsupported chain: ${chainId}`);
    }

    return chainConfig.bundlerUrl;
};
