import {config} from '../config';
import {
    FeePayerRequest,
    FeePayerResponse,
    GasCostEstimate,
    GasPolicy,
    GasPolicyConfig,
    PaymasterData,
    PaymasterOptions,
    PaymasterStubData,
    PaymasterTokenQuote,
    PolicyStatus,
    SponsoredUserOp,
    UserOperation
} from '../types/alchemyTypes';

const TIMEOUT = 10000;

/**
 * Simple Gas Manager API request - no retry logic for POC
 */
const makeGasManagerRequest = async <T>(
    method: string,
    params: any[]
): Promise<T> => {
    const baseUrl = `https://api.g.alchemy.com/v2/${config.alchemy.apiKey}`;

    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
    };

    console.log(`Making Gas Manager ${method} request`);

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
            throw new Error(`Gas Manager API Error: ${data.error.message}`);
        }

        return data.result;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Gas Manager ${method} failed:`, error);
        throw error;
    }
};

/**
 * Simple Policy API request - REST endpoint, no retry logic for POC
 */
const makePolicyRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
): Promise<T> => {
    const url = `https://api.g.alchemy.com/v2/${config.alchemy.apiKey}/policy${endpoint}`;

    console.log(`Making Policy ${method} request to ${endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${config.alchemy.apiKey}`
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json() as T;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Policy ${method} to ${endpoint} failed:`, error);
        throw error;
    }
};

export const requestGasAndPaymasterData = async (
    userOp: UserOperation
): Promise<PaymasterData> => {
    console.log('Requesting gas and paymaster data:', userOp.sender);
    const params: any = {userOp};
    if (config.alchemy.policyId) {
        params.policyId = config.alchemy.policyId;
    }

    return await makeGasManagerRequest<PaymasterData>(
        'alchemy_requestGasAndPaymasterAndData',
        [params]
    );
};

export const sponsorUserOperation = async (
    userOp: UserOperation
): Promise<SponsoredUserOp> => {
    console.log('Sponsoring UserOperation:', userOp.sender);
    const params: any = {
        userOp,
        sponsorshipType: 'full'
    };

    if (config.alchemy.policyId) {
        params.policyId = config.alchemy.policyId;
    }

    return await makeGasManagerRequest<SponsoredUserOp>(
        'alchemy_sponsorUserOperation',
        [params]
    );
};

export const getPaymasterOptions = async (
    userOp: UserOperation
): Promise<PaymasterOptions> => {
    console.log('Getting paymaster options:', userOp.sender);
    return await makeGasManagerRequest<PaymasterOptions>(
        'alchemy_getPaymasterOptions',
        [{userOp}]
    );
};

export const estimateGasCost = async (
    userOp: UserOperation
): Promise<GasCostEstimate> => {
    console.log('Estimating gas cost:', userOp.sender);
    return await makeGasManagerRequest<GasCostEstimate>(
        'alchemy_estimateGasCost',
        [{userOp}]
    );
};

export const getPaymasterStubData = async (
    userOp: UserOperation
): Promise<PaymasterStubData> => {
    console.log('Getting paymaster stub data:', userOp.sender);
    const params: any = {userOp};
    if (config.alchemy.policyId) {
        params.policyId = config.alchemy.policyId;
    }

    return await makeGasManagerRequest<PaymasterStubData>(
        'alchemy_getPaymasterStubData',
        [params]
    );
};

export const getTokenQuote = async (
    userOp: UserOperation,
    tokenAddress: string
): Promise<PaymasterTokenQuote> => {
    console.log('Getting token quote for:', tokenAddress);
    return await makeGasManagerRequest<PaymasterTokenQuote>(
        'alchemy_getTokenQuote',
        [{userOp, tokenAddress}]
    );
};

export const createFeePayer = async (
    feePayerRequest: FeePayerRequest
): Promise<FeePayerResponse> => {
    console.log('Creating fee payer');
    return await makeGasManagerRequest<FeePayerResponse>(
        'alchemy_createFeePayer',
        [feePayerRequest]
    );
};

// Policy Management Functions
export const createGasPolicy = async (
    policyConfig: GasPolicyConfig
): Promise<GasPolicy> => {
    console.log('Creating gas policy');
    return await makePolicyRequest<GasPolicy>('', 'POST', policyConfig);
};

export const getGasPolicyStatus = async (
    policyId: string
): Promise<PolicyStatus> => {
    console.log('Getting gas policy status:', policyId);
    return await makePolicyRequest<PolicyStatus>(`/${policyId}`);
};

export const updateGasPolicy = async (
    policyId: string,
    updates: Partial<GasPolicyConfig>
): Promise<GasPolicy> => {
    console.log('Updating gas policy:', policyId);
    return await makePolicyRequest<GasPolicy>(`/${policyId}`, 'PUT', updates);
};

export const deleteGasPolicy = async (
    policyId: string
): Promise<{ success: boolean }> => {
    console.log('Deleting gas policy:', policyId);
    return await makePolicyRequest<{ success: boolean }>(`/${policyId}`, 'DELETE');
};

export const listGasPolicies = async (): Promise<GasPolicy[]> => {
    console.log('Listing gas policies');
    return await makePolicyRequest<GasPolicy[]>('');
};

export const pauseGasPolicy = async (
    policyId: string
): Promise<{ success: boolean }> => {
    console.log('Pausing gas policy:', policyId);
    return await makePolicyRequest<{ success: boolean }>(`/${policyId}/pause`, 'POST');
};

export const resumeGasPolicy = async (
    policyId: string
): Promise<{ success: boolean }> => {
    console.log('Resuming gas policy:', policyId);
    return await makePolicyRequest<{ success: boolean }>(`/${policyId}/resume`, 'POST');
};
