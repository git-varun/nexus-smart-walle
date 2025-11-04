// frontend/src/hooks/useSmartAccountRedux.ts
import {useCallback, useEffect} from 'react';
import {useAccount, usePublicClient, useWalletClient} from 'wagmi';
import {createLightAccount} from '@account-kit/smart-contracts';
import {createSmartAccountClient, WalletClientSigner} from '@aa-sdk/core';
import {alchemy, baseSepolia} from '@account-kit/infra';
import {SmartAccountInfo} from '../types/account';
import {BatchExecuteParams, ExecuteTransactionParams} from '../types/transaction';
import {useToast} from './useToast';
import * as viem from 'viem';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
    completeAccountCreation,
    resetSmartAccountState,
    setCreationError,
    setGuardianError,
    setIsCreatingAccount,
    setIsExecuting,
    setIsLoading,
    setNewGuardian,
    setSmartAccountAddress,
    setSmartAccountInfo,
} from '../store/smartAccountSlice';
import {clearSmartAccountObjects, setSmartAccountObjects,} from '../store/smartAccountObjectsSlice';
import {
    selectGuardianError,
    selectIsCreatingAccount,
    selectIsExecuting,
    selectIsLoading,
    selectIsSmartAccountDeployed,
    selectIsSmartAccountReady,
    selectNewGuardian,
    selectSmartAccount,
    selectSmartAccountAddress,
    selectSmartAccountBalance,
    selectSmartAccountClient,
    selectSmartAccountInfo,
    selectSmartAccountNonce,
} from '../store/selectors';

export const useSmartAccount = () => {
    const {address, isConnected} = useAccount();
    const publicClient = usePublicClient();
    const {data: walletClient} = useWalletClient();
    const {toast} = useToast();
    // Simple progress tracking (replacing useAccountCreationProgress)
    const simpleProgress = {
        startProcess: () => {
        },
        runStep: async (name: string, fn: () => Promise<any>) => fn(),
        updateStepStatus: () => {
        },
        finishProcess: () => {
        },
        isProcessing: false,
        progress: 0,
        completedSteps: 0,
        totalSteps: 0,
        hasError: false,
        resetProgress: () => {
        }
    };

    // Redux state
    const dispatch = useAppDispatch();
    const smartAccountAddress = useAppSelector(selectSmartAccountAddress);
    const smartAccountInfo = useAppSelector(selectSmartAccountInfo);
    const isCreatingAccount = useAppSelector(selectIsCreatingAccount);
    const isExecuting = useAppSelector(selectIsExecuting);
    const isLoading = useAppSelector(selectIsLoading);
    const newGuardian = useAppSelector(selectNewGuardian);
    const guardianError = useAppSelector(selectGuardianError);
    const smartAccount = useAppSelector(selectSmartAccount);
    const smartAccountClient = useAppSelector(selectSmartAccountClient);
    const isSmartAccountReady = useAppSelector(selectIsSmartAccountReady);
    const balance = useAppSelector(selectSmartAccountBalance);
    const nonce = useAppSelector(selectSmartAccountNonce);
    const isDeployed = useAppSelector(selectIsSmartAccountDeployed);

    console.log('🏪 Redux useSmartAccount state:', {
        smartAccountAddress,
        hasSmartAccount: !!smartAccount,
        hasSmartAccountClient: !!smartAccountClient,
        isSmartAccountReady,
        isCreatingAccount,
        isConnected
    });

    // Smart account creation with progress tracking
    const createSmartAccount = useCallback(async () => {
        console.log('🚀 Redux createSmartAccount called!');

        // Start the progress tracking
        console.log('📊 Starting progress tracking...');
        simpleProgress.startProcess();
        dispatch(setIsCreatingAccount(true));
        dispatch(setCreationError(null));
        console.log('📊 Progress tracking started, isCreatingAccount set to true');

        try {
            // Step 1: Validate wallet connection
            await simpleProgress.runStep(
                'validate-wallet',
                async () => {
                    console.log('Validating prerequisites...');

                    if (!address || !publicClient || !walletClient) {
                        throw new Error('Wallet not connected. Please connect your wallet first.');
                    }

                    if (!import.meta.env.VITE_ALCHEMY_API_KEY) {
                        throw new Error('Alchemy API key is not configured. Please set VITE_ALCHEMY_API_KEY.');
                    }

                    console.log('✅ Prerequisites validated');
                },
                'Checking wallet connection and API configuration...',
                'Wallet connection and configuration verified'
            );

            // Step 2: Create transport
            let transport: any;
            await simpleProgress.runStep(
                'create-transport',
                async () => {
                    console.log('Creating Alchemy transport...');
                    transport = alchemy({
                        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
                    });
                    console.log('✅ Transport created');
                },
                'Initializing connection to Alchemy...',
                'Alchemy transport layer ready'
            );

            // Step 3: Create signer
            let signer: WalletClientSigner;
            await simpleProgress.runStep(
                'create-signer',
                async () => {
                    console.log('Creating wallet client signer...');
                    signer = new WalletClientSigner(
                        walletClient!,
                        "external" // signerType for external wallets like MetaMask
                    );
                    console.log('✅ Signer created');
                },
                'Setting up wallet signer adapter...',
                'Wallet signer adapter ready'
            );

            // Step 4: Create smart account
            let account: any;
            await simpleProgress.runStep(
                'create-account',
                async () => {
                    console.log('Creating smart account...');
                    account = await createLightAccount({
                        transport,
                        chain: baseSepolia,
                        signer,
                    });
                    console.log('✅ Smart account created:', account.address);
                },
                'Deploying your smart account...',
                'Smart account deployed successfully'
            );

            // Update the step with the actual address after creation
            if (account?.address) {
                simpleProgress.updateStepStatus(
                    'create-account',
                    'completed',
                    `Smart account deployed at ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                );
            }

            // Step 5: Create smart account client
            let client: any;
            await simpleProgress.runStep(
                'create-client',
                async () => {
                    console.log('Creating smart account client...');
                    client = createSmartAccountClient({
                        transport,
                        chain: baseSepolia,
                        account,
                    });
                    console.log('✅ Smart account client created');
                },
                'Setting up transaction client...',
                'Transaction client ready for gasless operations'
            );

            // Step 6: Finalize setup
            await simpleProgress.runStep(
                'finalize',
                async () => {
                    console.log('Finalizing setup...');
                    console.log('🏪 About to dispatch Redux actions:', {
                        address: account.address,
                        account: !!account,
                        client: !!client
                    });

                    // Update Redux store with the new account data
                    dispatch(setSmartAccountAddress(account.address));
                    dispatch(setSmartAccountObjects({account, client}));

                    console.log('✅ Setup finalized - Smart Account Address:', account.address);
                    console.log('🏪 Redux actions dispatched');

                    // Small delay to ensure Redux updates are processed
                    await new Promise(resolve => setTimeout(resolve, 100));
                },
                'Completing initialization...',
                'Smart account is ready for use!'
            );

            // Mark creation as complete
            dispatch(completeAccountCreation({address: account.address}));

            // Success notification
            toast({
                title: 'Smart Account Created Successfully!',
                description: 'Your smart account is ready for gasless transactions',
                variant: 'success'
            });

            // Auto-refresh account data after creation
            console.log('📊 Auto-refreshing account data...');
            await refreshData();

        } catch (error) {
            console.error('Failed to create smart account:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to create smart account';

            dispatch(setCreationError(errorMessage));

            toast({
                title: 'Account Creation Failed',
                description: errorMessage,
                variant: 'error'
            });

            // The error is already handled by runStep, so we don't need to do anything else
        } finally {
            console.log('🏁 Account creation process finishing...');

            simpleProgress.finishProcess();
            dispatch(setIsCreatingAccount(false));

            console.log('🏁 Account creation process completed');
        }
    }, [address, publicClient, walletClient, toast, simpleProgress, dispatch]);

    // Execute single transaction
    const executeTransaction = useCallback(async (params: ExecuteTransactionParams) => {
        console.log('💸 Redux executeTransaction called with:', {
            hasSmartAccount: !!smartAccount,
            hasSmartAccountClient: !!smartAccountClient,
            smartAccountAddress,
            params
        });

        if (!smartAccountClient || !smartAccount) {
            console.error('❌ Smart account objects missing:', {
                smartAccount: !!smartAccount,
                smartAccountClient: !!smartAccountClient,
                smartAccountAddress
            });
            throw new Error('Smart account not available');
        }

        dispatch(setIsExecuting(true));
        try {
            // Execute transaction using Account Kit
            const result = await smartAccountClient.sendUserOperation({
                calls: [{
                    target: params.target,
                    data: params.data || '0x',
                    value: BigInt(params.value || 0),
                }],
            });

            // Wait for transaction to be mined
            const txHash = await smartAccountClient.waitForUserOperationTransaction({
                hash: result.hash,
            });

            toast({
                title: 'Transaction Sent',
                description: 'Your gasless transaction has been submitted',
                variant: 'success'
            });

            return {
                userOpHash: result.hash,
                txHash,
                success: true
            };
        } catch (error) {
            console.error('Transaction failed:', error);
            toast({
                title: 'Transaction Failed',
                description: 'Failed to execute transaction',
                variant: 'error'
            });
            throw error;
        } finally {
            dispatch(setIsExecuting(false));
        }
    }, [smartAccountClient, smartAccount, smartAccountAddress, toast, dispatch]);

    // Execute batch transactions
    const executeBatchTransaction = useCallback(async (params: BatchExecuteParams) => {
        if (!smartAccountClient || !smartAccount) {
            throw new Error('Smart account not available');
        }

        dispatch(setIsExecuting(true));
        try {
            // Execute batch transactions using Account Kit
            const batchCalls = params.transactions.map(tx => ({
                target: tx.target,
                data: tx.data || '0x',
                value: BigInt(tx.value || 0),
            }));

            const result = await smartAccountClient.sendUserOperation({
                calls: batchCalls,
            });

            // Wait for transaction to be mined
            const txHash = await smartAccountClient.waitForUserOperationTransaction({
                hash: result.hash,
            });

            toast({
                title: 'Batch Transaction Sent',
                description: `${params.transactions.length} transactions submitted in batch`,
                variant: 'success'
            });

            return {
                userOpHash: result.hash,
                txHash,
                success: true
            };
        } catch (error) {
            console.error('Batch transaction failed:', error);
            toast({
                title: 'Batch Transaction Failed',
                description: 'Failed to execute batch transaction',
                variant: 'error'
            });
            throw error;
        } finally {
            dispatch(setIsExecuting(false));
        }
    }, [smartAccountClient, smartAccount, toast, dispatch]);

    // Refresh account data
    const refreshData = useCallback(async () => {
        if (!smartAccount || !smartAccountClient || !publicClient) return;

        dispatch(setIsLoading(true));
        try {
            // Fetch real account data using Account Kit
            const balanceResult = await publicClient.getBalance({
                address: smartAccount.address,
            });

            let nonceResult = 0n;
            try {
                nonceResult = smartAccount.getNonce ? await smartAccount.getNonce() : 0n;
            } catch (err) {
                // fallback to direct contract read if needed
                try {
                    const contractNonce = await publicClient.readContract({
                        address: smartAccount.address,
                        abi: SmartAccountAbi,
                        functionName: 'nonce',
                    }) as bigint;
                    nonceResult = contractNonce;
                } catch (contractErr) {
                    nonceResult = 0n;
                }
            }

            // Check if account is deployed
            const code = await publicClient.getCode({
                address: smartAccount.address,
            });
            const isDeployedResult = code !== undefined && code !== '0x';

            const accountInfo: SmartAccountInfo = {
                address: smartAccount.address,
                owner: address || '',
                nonce: Number(nonceResult),
                isDeployed: isDeployedResult,
                balance: viem.formatEther(balanceResult),
                modules: [] // TODO: Fetch installed modules if needed
            };

            dispatch(setSmartAccountInfo(accountInfo));
        } catch (error) {
            console.error('Failed to refresh account data:', error);
            toast({
                title: 'Account Data Error',
                description: 'Could not fetch smart account info.',
                variant: 'error'
            });
        } finally {
            dispatch(setIsLoading(false));
        }
    }, [smartAccount, smartAccountClient, publicClient, address, toast, dispatch]);

    // Guardian address validation
    const handleAddGuardian = () => {
        if (!viem.isAddress(newGuardian)) {
            dispatch(setGuardianError("Invalid Ethereum address"));
            toast({
                title: "Invalid Address",
                description: "Please enter a valid Ethereum address.",
                variant: "error"
            });
            return;
        }
        dispatch(setGuardianError(''));
        // ...existing code for adding guardian...
    };

    // Auto-refresh data when account changes
    useEffect(() => {
        if (smartAccount && smartAccountAddress) {
            console.log('🔄 Auto-refreshing data for smart account:', smartAccountAddress);
            refreshData();
        }
    }, [smartAccount, smartAccountAddress, refreshData]);

    // Reset state when wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            console.log('🔌 Wallet disconnected, clearing smart account state');
            dispatch(resetSmartAccountState());
            dispatch(clearSmartAccountObjects());
        }
    }, [isConnected, dispatch]);

    // UserOperation submission with error handling
    const submitUserOperation = async () => {
        toast({
            title: "Not Implemented",
            description: "Bundler integration is not yet implemented.",
            variant: "error"
        });
        throw new Error("Bundler integration is not implemented.");
    };

    return {
        // Connection state
        isConnected,
        address,

        // Smart account objects
        smartAccount,
        smartAccountClient,

        // Smart account state (from Redux)
        smartAccountAddress,
        smartAccountInfo,
        isCreatingAccount,
        isExecuting,
        isLoading,

        // Derived state
        balance,
        nonce,
        isDeployed,
        tokenBalances: [], // TODO: Implement token balance fetching
        paymasterDeposit: '0.1', // TODO: Fetch real paymaster deposit

        // Progress tracking
        creationProgress: simpleProgress,

        // Actions
        createSmartAccount,
        executeTransaction,
        executeBatchTransaction,
        refreshData,
        handleAddGuardian,
        isSmartAccountReady: () => isSmartAccountReady,
        error: guardianError,
        newGuardian,
        setNewGuardian: (value: string) => dispatch(setNewGuardian(value)),
        submitUserOperation
    };
};
