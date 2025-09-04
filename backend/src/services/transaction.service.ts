import {transactionRepository} from '../repositories';
import {createServiceLogger} from '../utils';
import {TransactionHistoryResult, TransactionInfo, TransactionRequest, TransactionResult} from '../types';
import * as ethers from 'ethers';
import {BigNumberish} from 'ethers';
import {getOrCreateUserAccount} from "./account.service";
import {UserOperationV07} from "../types/api";
import {config} from "../config";
import {wallet_getCallsStatus, wallet_prepareCalls, wallet_sendPreparedCalls} from "../scripts/alchemyWalletApi";
import {SmartAccount} from "../types/SmartAccount";
import {CallsStatus} from "../types/alchemyTypes";

// Define WalletCall type locally for POC
interface WalletCall {
    to: string;
    data: string;
    value?: string;
}

const logger = createServiceLogger('TransactionService');

async function getUserAccount(userId: string, chainId: number): Promise<SmartAccount> {
    const smartAccountResult = await getOrCreateUserAccount(userId, chainId);
    if (!smartAccountResult.success || !smartAccountResult.account) {
        throw new Error(smartAccountResult.error || 'Failed to get smart account');
    }
    return smartAccountResult.account;
}

async function prepareUserOperation(userId: string, chainId: number, request: TransactionRequest): Promise<UserOperationV07> {

    const calls: WalletCall[] = [{
        to: request.to,
        data: request.data || '0x',
        value: ethers.toBeHex(request.value as BigNumberish)
    }];

    const smartAccount = await getUserAccount(userId, chainId);

    const requestData = {
        from: smartAccount.address,
        chainId: ethers.toBeHex(chainId as BigNumberish),
        calls,
        capabilities: {
            paymasterService: {
                policyId: config.alchemy.policyId
            }
        }
    };

    const preparedResult = await wallet_prepareCalls([requestData]);
    const userOp = preparedResult.data;
    // const factoryData = ethers.keccak256(userOp.factoryData);
    // const entryPoint = config.alchemy.entryPointV07;
    // const callDataHash = ethers.keccak256(userOp.callData);
    // const paymasterDataHash = ethers.keccak256(userOp.paymasterData);
    // const factoryData = ethers.keccak256(userOp.factoryData);
    // const packedUserOp = ethers.solidityPacked(
    //     [
    //         'address',  // sender
    //         'uint256',  // nonce
    //         'address',  // factory (NOT hashed)
    //         'bytes32',  // factoryData hash
    //         'bytes32',  // callData hash
    //         'uint256',  // callGasLimit
    //         'uint256',  // verificationGasLimit
    //         'uint256',  // preVerificationGas
    //         'uint256',  // maxFeePerGas
    //         'uint256',  // maxPriorityFeePerGas
    //         'address',  // paymaster (NOT hashed)
    //         'uint256',  // paymasterVerificationGasLimit
    //         'uint256',  // paymasterPostOpGasLimit
    //         'bytes32'   // paymasterData hash
    //     ],
    //     [
    //         userOp.sender,
    //         userOp.nonce,
    //         userOp.factory,  // Direct factory address
    //         factoryData,  // Hash factoryData
    //         callDataHash,
    //         userOp.callGasLimit,
    //         userOp.verificationGasLimit,
    //         userOp.preVerificationGas,
    //         userOp.maxFeePerGas,
    //         userOp.maxPriorityFeePerGas,
    //         userOp.paymaster,  // Direct paymaster address
    //         userOp.paymasterVerificationGasLimit,
    //         userOp.paymasterPostOpGasLimit,
    //         paymasterDataHash
    //     ]
    // );

    // const userOpHash = ethers.keccak256(packedUserOp);
    // const finalHash = ethers.keccak256(
    //     ethers.solidityPacked(
    //         ['bytes32', 'address', 'uint256'],
    //         [userOpHash, entryPoint, chainId]
    //     )
    // );
    //
    // // Sign the hash provided by Alchemy
    // const hashBytes = ethers.getBytes(finalHash);
    const wallet = new ethers.Wallet(config.centralWallet.privateKey);
    const signature = await wallet.signMessage(ethers.getBytes(preparedResult.signatureRequest.data.raw));

    return {...userOp, signature};
}

/**
 * Send a transaction using Alchemy Account Kit smart account integration
 */
export async function sendTransaction(
    userId: string,
    chainId: number,
    request: TransactionRequest
): Promise<TransactionResult> {
    try {
        logger.info('Sending transaction via Alchemy APIs', {userId, chainId, to: request.to});

        const smartAccount = await getUserAccount(userId, chainId);

        const userOperation = await prepareUserOperation(userId, chainId, request);

        const requestData = {
            type: "user-operation-v070",
            data: {
                sender: userOperation.sender,
                nonce: userOperation.nonce,
                callData: userOperation.callData,

                callGasLimit: userOperation.callGasLimit,
                verificationGasLimit: userOperation.verificationGasLimit,
                preVerificationGas: userOperation.preVerificationGas,
                maxFeePerGas: userOperation.maxFeePerGas,
                maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,

                factory: userOperation.factory,
                factoryData: userOperation.factoryData,

                paymaster: userOperation.paymaster,
                paymasterData: userOperation.paymasterData,

                paymasterVerificationGasLimit: userOperation.paymasterVerificationGasLimit,
                paymasterPostOpGasLimit: userOperation.paymasterPostOpGasLimit,
            },
            chainId: ethers.toBeHex(chainId as BigNumberish),
            signature: {
                type: "secp256k1",
                data: userOperation.signature
            }
        }

        const result = await wallet_sendPreparedCalls(requestData);

        if (!result.preparedCallIds || !result.preparedCallIds.length) {
            throw new Error('Failed to send user operation');
        }

        const pendingTransaction = {
            userId,
            smartAccountId: smartAccount.address,
            hash: "",
            userOpHash: result.preparedCallIds[0],
            to: request.to,
            value: request.value?.toString() || '0',
            data: request.data || '',
            status: 'pending' as const,
            chainId: chainId
        };

        const savedTransaction = await transactionRepository.create(pendingTransaction);

        const transactionInfo: TransactionInfo = {
            id: savedTransaction.id,
            hash: savedTransaction.hash,
            userOpHash: savedTransaction.userOpHash,
            to: savedTransaction.to,
            value: savedTransaction.value,
            data: savedTransaction.data,
            status: savedTransaction.status,
            createdAt: savedTransaction.createdAt,
            updatedAt: savedTransaction.updatedAt
        };

        logger.info('Transaction sent successfully', {
            transactionId: savedTransaction.id,
            userOpHash: result.preparedCallIds,
            chainId
        });

        return {
            success: true,
            transaction: transactionInfo
        };
    } catch (error) {
        logger.error('Transaction failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
        };
    }
}

/**
 * Estimate gas for a transaction using Alchemy Account Kit
 */
export async function estimateGas(
    userId: string,
    chainId: number,
    request: TransactionRequest
): Promise<{ success: boolean, gasEstimate?: UserOperationV07, error?: Error | string }> {
    try {
        logger.info('Estimating gas via Alchemy APIs', {userId, chainId, to: request.to});

        const userOperation = await prepareUserOperation(userId, chainId, request);
        console.log('Estimating gas via Alchemy APIs', {userOperation});

        logger.info('Gas estimation completed', {userId, chainId, ...userOperation});

        return {
            success: true,
            gasEstimate: userOperation
        };

    } catch (error) {
        logger.error('Gas estimation failed', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Gas estimation failed'
        };
    }
}


export async function getUserOperationStatus(callId: string, chainId: number): Promise<{
    success: boolean,
    receipts?: TransactionInfo[],
    error?: Error | string
}> {
    try {
        logger.info('Getting user transaction stats', {callId, chainId});

        const result: CallsStatus = await wallet_getCallsStatus([callId]);

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
                transactionRepository.findUserOpByHashAndUpdate(result.id || "", receipt.transactionHash, receipt.gasUsed);
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

/**
 * Get user transaction history
 */
export async function getUserTransactionHistory(
    userId: string,
    chainId?: number
): Promise<TransactionHistoryResult> {
    try {
        logger.info('Getting transaction history', {userId, chainId});

        const transactions = await transactionRepository.findByUserId(userId, chainId);

        console.log(transactions);

        const transactionInfos: TransactionInfo[] = transactions.map(tx => ({
            id: tx.id,
            hash: tx.hash,
            userOpHash: tx.userOpHash || undefined,
            to: tx.to,
            value: tx.value,
            data: tx.data || undefined,
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
