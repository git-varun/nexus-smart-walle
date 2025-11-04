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
import {numberToHex} from "viem";
import {signMessage} from "../utils/helpers";
import {privateKeyToAccount} from "viem/accounts";
import {generateSalt} from "../utils/viemHelpers";
import {createServiceLogger} from "../utils";


const logger = createServiceLogger("alchemyWalletApi");

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
    userId: string, chainId: number, accountType: string
): Promise<AlchemyWalletRequestAccountResponse> => {

    const account = privateKeyToAccount(config.centralWallet.privateKey as `0x${string}`);
    const accountId = crypto.randomUUID();
    const salt = generateSalt(userId, chainId);

    const requestParams = {
        signerAddress: account.address,
        id: accountId,
        creationHint: {
            salt: salt,
            accountType: accountType,
            createAdditional: true
        },
        includeCounterfactualInfo: true
    };

    logger.info('Requesting smart account:');

    return await makeAlchemyRequest<AlchemyWalletRequestAccountResponse>(
        'wallet_requestAccount',
        [requestParams]
    );
}

export const wallet_prepareCalls = async (address: string, chainId: number, request: any): Promise<any> => {
    console.log('Preparing wallet calls');
    const params = [{
        from: address,
        chainId: numberToHex(chainId),
        calls: [request],
        capabilities: {
            paymasterService: {
                policyId: config.alchemy.policyId,
            }
        }
    }];
    return await makeAlchemyRequest<PreparedCalls>('wallet_prepareCalls', params);
};

export const wallet_sendPreparedCalls = async (userOperation: any): Promise<string> => {
    console.log('Sending prepared calls');

    const params = {
        type: userOperation.type,
        data: userOperation.data,
        chainId: userOperation.chainId,
        signature: {
            type: "secp256k1",
            data: await signMessage(userOperation.signatureRequest.data.raw)
        }
    }
    console.log('Sending prepared calls send', params);

    const result = await makeAlchemyRequest<{ preparedCallIds: string[]; }>(
        'wallet_sendPreparedCalls',
        [params]
    );

    if (!result.preparedCallIds || !result.preparedCallIds.length) {
        throw new Error('Failed to send user operation');
    }

    return result.preparedCallIds[0];
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

export const getUserOperationByHash = async (userOpHash: [string]): Promise<string | null> => {
    console.log('Getting user operation by hash');
    const params = [
        userOpHash,
    ]

    return await makeAlchemyRequest('eth_getUserOperationReceipt', params)
}