import {transactionRepository} from '../repositories';
import {createServiceLogger} from '../utils';
import {wallet_getCallsStatus, wallet_prepareCalls, wallet_sendPreparedCalls} from "../scripts/alchemyWalletApi";
import {getAddress, hexToNumber, isAddress} from 'viem'
import {TransactionInfo, TransactionRequest} from '../types';
import {getUserAccount} from "./account.service";
import {IAccount, ITransaction} from "../models";
import {getUserOperationByHash} from "../scripts/bundlerApi";
import {getUserOperationGasPrice} from "../scripts/pimlicoApi";


const logger = createServiceLogger('TransactionService');

async function userAccount(userId: string, chainId: number): Promise<IAccount> {
    const smartAccountResult = await getUserAccount(userId, chainId);
    if (!smartAccountResult.success || !smartAccountResult.account) {
        throw new Error(smartAccountResult.error || 'Failed to get smart account');
    }
    return smartAccountResult.account;
}

// async function prepareUserOp(userId: string, chainId: number, bundler: string): Promise<any> {
//     const account = await userAccount(userId, chainId);
//     const result = await getGasPriceObject(chainId, bundler);
//
//     if (!result.success) {
//         throw new Error('Error getting gas price');
//     }
//     const publicClient = createPublicClient({
//         chain: baseSepolia,
//         transport: http(`https://base-sepolia.g.alchemy.com/v2/I3POjlK37a4nA5GFoVdufRMKa5hbnxTd`),
//     })
//     const nonce = await publicClient.getTransactionCount({address: account.address as `0x${string}`});
//
//
//     return {
//         sender: account.address as `0x${string}`,
//         nonce: toHex(nonce),
//         callData: '0xa9059cbb0000000000000000000000004ba490f618148427b35c276eaa8d548e9cc62ad00000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`,
//
//         callGasLimit: "0x0",
//         verificationGasLimit: "0x0",
//
//         maxFeePerGas: result.gasPrice.fast.maxFeePerGas,
//         maxPriorityFeePerGas: result.gasPrice.fast.maxPriorityFeePerGas,
//
//         factory: account.isDeployed ? undefined : account.factoryAddress as `0x${string}`,
//         factoryData: account.isDeployed ? undefined : account.factoryData as `0x${string}`,
//
//         signature: "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c" as `0x${string}`
//     }
// }


/**
 * Send a transaction using Alchemy Account Kit smart account integration
 */
export async function sendTransaction(
    userId: string,
    chainId: number,
    bundler: string,
    request: TransactionRequest
): Promise<{ success: boolean, transaction?: ITransaction, error?: string | Error }> {
    try {
        // Validate recipient address
        if (!isAddress(request.to)) {
            throw new Error(`Invalid recipient address: ${request.to}`);
        }

        // Get checksummed address
        const checksummedTo = getAddress(request.to);

        logger.info('initiated', {
            userId,
            chainId,
            to: checksummedTo,
            value: request.value?.toString(),
            data: request.data
        });

        const account = await userAccount(userId, chainId);

        let userOpHash: string = "";
        if (bundler === 'ALCHEMY') {
            const userOperation = await wallet_prepareCalls(account.address, chainId, request);
            logger.info('Prepared User Operation', userOperation);
            userOpHash = await wallet_sendPreparedCalls(userOperation);
        } else {
            throw new Error('Only alchemy is supported now')
        }
        const savedTransaction = await transactionRepository.createTransaction({
            userId,
            accountId: account.address,
            hash: userOpHash,
            userOpHash,
            status: 'pending' as const,
            chainId: chainId
        });

        logger.info('Transaction sent successfully', {
            transactionId: savedTransaction.id,
            userOpHash: userOpHash,
            chainId
        });

        return {
            success: true,
            transaction: savedTransaction
        };
    } catch (error) {
        logger.error('Transaction failed', error instanceof Error ? error : new Error(String(error)));

        return {
            success: false,
            error: error instanceof Error ? new Error(String(error)) : 'Transaction failed'
        };
    }
}

/**
 * Estimate gas for a transaction using Alchemy Account Kit
 */
export async function estimateGas(
    userId: string,
    chainId: number,
    bundler: string,
    request: TransactionRequest
): Promise<{ success: boolean, gasEstimate?: any, error?: Error | string }> {
    try {
        if (!isAddress(request.to)) {
            throw new Error(`Invalid recipient address: ${request.to}`);
        }
        const checksummedTo = getAddress(request.to);

        logger.info('Estimating gas', {
            userId,
            chainId,
            to: checksummedTo,
            value: request.value?.toString(),
        });

        const account = await userAccount(userId, chainId);

        let userOperation;
        if (bundler === 'ALCHEMY') userOperation = await wallet_prepareCalls(account.address, chainId, request);
        else throw new Error('Only alchemy is supported now')

        logger.info('Gas estimation completed', {userId, chainId, ...userOperation});

        return {
            success: true,
            gasEstimate: {
                maxPriorityFeePerGas: hexToNumber(userOperation.data.maxPriorityFeePerGas),
                maxFeePerGas: hexToNumber(userOperation.data.maxFeePerGas),
                preVerificationGas: hexToNumber(userOperation.data.preVerificationGas),
                verificationGasLimit: hexToNumber(userOperation.data.verificationGasLimit),
                callGasLimit: hexToNumber(userOperation.data.callGasLimit),
                paymasterVerificationGasLimit: hexToNumber(userOperation.data.paymasterVerificationGasLimit),
            },
        };

    } catch (error) {
        logger.error('Gas estimation failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Gas estimation failed'
        };
    }
}


export async function getUserOperationStatus(chainId: number, userOpHash?: string, callId?: string): Promise<{
    success: boolean,
    receipts?: TransactionInfo[],
    error?: Error | string
}> {
    try {
        logger.info('Getting user transaction stats', {callId, chainId});

        let result: any;
        if (callId) result = await wallet_getCallsStatus([callId]);
        else if (userOpHash) result = await getUserOperationByHash(userOpHash);



        if (!result.status || !result.receipts.length) {
            throw new Error('Failed to send user operation');
        }

        result.receipts.forEach((receipt: {
            id: string,
            status: string;
            transactionHash: string;
            gasUsed: number;
        }) => {
            if (receipt.status === '0x1') {
                transactionRepository.findTransactionByHash(receipt.transactionHash);
            }
        })

        return {
            success: true,
            receipts: result.receipts
        }

    } catch (error) {
        logger.error('getting user transaction status is failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'getting user transaction status is failed'
        };
    }
}

export async function getUserTransactionHistory(userId: string, chainId?: number): Promise<{
    success: boolean,
    transactions?: any,
    error?: Error | string
}> {
    try {
        logger.info('Getting transaction history', {userId, chainId});

        const transactions = await transactionRepository.findTransactionsByUserId(userId);

        const transactionInfos = transactions.map(tx => ({
            id: tx.id,
            hash: tx.hash,
            userOpHash: tx.userOpHash || undefined,
            status: tx.status,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt
        }));

        logger.info('Transaction history retrieved', {
            userId,
            chainId,
            count: transactionInfos.length
        });

        return {
            success: true,
            transactions: transactionInfos
        };

    } catch (error) {
        logger.error('Failed to get transaction history', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get transaction history'
        };
    }
}

export async function getGasPriceObject(chainId: number, bundler: string): Promise<{
    success: boolean,
    gasPrice?: any,
    error?: Error | string
}> {
    try {
        logger.info('Getting gas price', {chainId, bundler});

        // const client = await publicClient(bundler, chainId)
        // const feeData = await client.estimateFeesPerGas();
        // const gasPrice = await client.getGasPrice();
        // const gasPriceObject = {
        //     maxFeePerGas: feeData.maxFeePerGas?.toString(),
        //     maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        //     gasPrice: gasPrice?.toString(),
        //     source: bundler
        // };

        const gasPriceObject = await getUserOperationGasPrice(chainId);

        logger.info('Latest transaction gas price fetched', gasPriceObject);

        return {
            success: true,
            gasPrice: gasPriceObject
        }

    } catch (error) {
        logger.error('Failed to get gas price', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get gas price'
        };
    }
}
