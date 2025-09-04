import {config} from '../config';
import {
    AccountInfo,
    AlchemyApiResponse,
    AlchemyWalletRequestAccountResponse,
    CallsStatus,
    FormattedSignature,
    PreparedCalls,
    SessionResult,
    SignatureRequest,
    WalletCapabilities
} from '../types/alchemyTypes';


const TIMEOUT = 10000;

/**
 * Simple Alchemy API request - no retry logic for POC
 */
export const makeAlchemyRequest = async <T>(method: string, params: any[]): Promise<T> => {
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
        const response = await fetch(config.alchemy.walletApiUrl, {
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

        const data = await response.json() as AlchemyApiResponse<T>;

        if (data.error) {
            throw new Error(`Alchemy API Error: ${data.error.message}`);
        }

        return data.result!;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`${method} failed:`, error);
        throw error;
    }
};


/**
 * Request account from Alchemy using wallet_requestAccount API
 * This is the core method for centralized wallet integration
 */
export const requestAccount = async (
    signerAddress: string,
    creationParams?: {
        id?: string;
        salt?: string;
        accountType?: string;
    }
): Promise<AlchemyWalletRequestAccountResponse> => {
    const accountId = creationParams?.id || crypto.randomUUID();
    const salt = creationParams?.salt || "0x2";
    const accountType = creationParams?.accountType || "sma-b";

    const requestParams = {
        signerAddress,
        id: accountId,
        creationHint: {
            salt: salt,
            accountType: accountType,
            createAdditional: true
        },
        includeCounterfactualInfo: true
    };

    console.log('Requesting smart account:', signerAddress);

    return await makeAlchemyRequest<AlchemyWalletRequestAccountResponse>(
        'wallet_requestAccount',
        [requestParams]
    );
}

export const wallet_prepareCalls = async (params: any[]): Promise<PreparedCalls> => {
    console.log('Preparing wallet calls');
    return await makeAlchemyRequest<PreparedCalls>('wallet_prepareCalls', params);
};

export const wallet_sendPreparedCalls = async (params: any): Promise<{ preparedCallIds: string[]; }> => {
    console.log('Sending prepared calls:', params);
    return await makeAlchemyRequest<{ preparedCallIds: string[]; }>(
        'wallet_sendPreparedCalls',
        [params]
    );
};

export const wallet_getCallsStatus = async (preparedCallIds: string[]): Promise<CallsStatus> => {
    return await makeAlchemyRequest<CallsStatus>('wallet_getCallsStatus', preparedCallIds);
};


export const wallet_createSession = async (sessionPublicKey: string, permissions: any): Promise<SessionResult> => {
    console.log('Creating wallet session');
    return await makeAlchemyRequest<SessionResult>(
        'wallet_createSession',
        [{sessionPublicKey, permissions}]
    );
};

export const wallet_formatSign = async (signatureRequest: SignatureRequest): Promise<FormattedSignature> => {
    return await makeAlchemyRequest<FormattedSignature>('wallet_formatSign', [signatureRequest]);
};

export const wallet_getCapabilities = async (): Promise<WalletCapabilities> => {
    return await makeAlchemyRequest<WalletCapabilities>('wallet_getCapabilities', []);
};

export const wallet_listAccounts = async (): Promise<AccountInfo[]> => {
    return await makeAlchemyRequest<AccountInfo[]>('wallet_listAccounts', []);
};

export const wallet_prepareSign = async (signatureRequest: SignatureRequest): Promise<{
    messageHash: string;
    preparedSignature: string
}> => {
    return await makeAlchemyRequest<{ messageHash: string; preparedSignature: string }>(
        'wallet_prepareSign',
        [signatureRequest]
    );
};
