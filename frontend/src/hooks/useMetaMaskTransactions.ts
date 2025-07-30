import {useSendTransaction, useWaitForTransactionReceipt} from 'wagmi';
import {parseEther} from 'viem';
import {useState} from 'react';

export interface MetaMaskTransactionResult {
    hash: string;
    success: boolean;
    receipt?: any;
}

export function useMetaMaskTransactions() {
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const {sendTransaction, isPending: isSending, error: sendError} = useSendTransaction();

    const {
        data: receipt,
        isLoading: isWaitingForReceipt,
        error: receiptError
    } = useWaitForTransactionReceipt({
        hash: lastTxHash as `0x${string}` | undefined,
    });

    const sendMetaMaskTransaction = async (
        to: string,
        value?: string,
        data?: string
    ): Promise<MetaMaskTransactionResult> => {
        return new Promise((resolve, reject) => {
            try {
                sendTransaction(
                    {
                        to: to as `0x${string}`,
                        value: value ? parseEther(value) : undefined,
                        data: data as `0x${string}` | undefined,
                    },
                    {
                        onSuccess: (hash) => {
                            console.log('✅ MetaMask transaction sent:', hash);
                            setLastTxHash(hash);

                            // Return immediately with transaction hash
                            resolve({
                                hash,
                                success: true,
                            });
                        },
                        onError: (error) => {
                            console.error('❌ MetaMask transaction failed:', error);
                            reject(error);
                        },
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    };

    return {
        sendMetaMaskTransaction,
        isSending,
        isWaitingForReceipt,
        lastTxHash,
        receipt,
        sendError,
        receiptError,
        isLoading: isSending || isWaitingForReceipt,
    };
}
