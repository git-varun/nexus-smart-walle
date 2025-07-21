// frontend/src/hooks/useSmartAccount.ts
import {useCallback, useEffect, useRef, useState} from 'react';
import {useAccount, usePublicClient, useWalletClient} from 'wagmi';
import {createLightAccount} from '@account-kit/smart-contracts';
import {createSmartAccountClient, WalletClientSigner} from '@aa-sdk/core';
import {alchemy, baseSepolia} from '@account-kit/infra';
import {SmartAccountInfo, UserOperation} from '../types/account';
import {BatchExecuteParams, ExecuteTransactionParams} from '../types/transaction';
import {useToast} from './useToast';
import {useAccountCreationProgress} from './useAccountCreationProgress';
import * as viem from 'viem';
import SmartAccountAbi from '../abis/SmartAccount.json';

export const useSmartAccount = () => {
    const {address, isConnected} = useAccount();
    const publicClient = usePublicClient();
    const {data: walletClient} = useWalletClient();
    const {toast} = useToast();
    const accountProgress = useAccountCreationProgress();

    const [smartAccount, setSmartAccount] = useState<any | null>(null);
    const [smartAccountClient, setSmartAccountClient] = useState<any | null>(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState<string>('');

    // Use refs to store the actual objects to prevent them from being lost
    const smartAccountRef = useRef<any | null>(null);
    const smartAccountClientRef = useRef<any | null>(null);
    const smartAccountAddressRef = useRef<string>('');
    const [smartAccountInfo, setSmartAccountInfo] = useState<SmartAccountInfo | null>(null);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [newGuardian, setNewGuardian] = useState('');
    const [error, setError] = useState('');

    // Helper function to sync refs and state
    const syncAccountState = useCallback((account: any, client: any, address: string) => {
        console.log('🔄 syncAccountState called with:', {account: !!account, client: !!client, address});

        // Update refs first
        smartAccountRef.current = account;
        smartAccountClientRef.current = client;
        smartAccountAddressRef.current = address;

        // Then update state
        setSmartAccount(account);
        setSmartAccountClient(client);
        setSmartAccountAddress(address);

        console.log('🔄 syncAccountState completed - refs updated:', {
            accountRef: !!smartAccountRef.current,
            clientRef: !!smartAccountClientRef.current,
            addressRef: smartAccountAddressRef.current
        });
    }, []);

    // Smart account creation with progress tracking
    const createSmartAccount = useCallback(async () => {
        console.log('🚀 createSmartAccount called!');

        // Start the progress tracking
        console.log('📊 Starting progress tracking...');
        accountProgress.startProcess();
        setIsCreatingAccount(true);
        console.log('📊 Progress tracking started, isCreatingAccount set to true');

        try {
            // Step 1: Validate wallet connection
            await accountProgress.runStep(
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
            await accountProgress.runStep(
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
            await accountProgress.runStep(
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
            await accountProgress.runStep(
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
                accountProgress.updateStepStatus(
                    'create-account',
                    'completed',
                    `Smart account deployed at ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                );
            }

            // Step 5: Create smart account client
            let client: any;
            await accountProgress.runStep(
                'create-client',
                async () => {
                    console.log('Creating smart account client...');
                    client = createSmartAccountClient({
                        transport,
                        chain: baseSepolia,
                        account,
                        // Add gas manager configuration if available
                        // opts: { gasManagerConfig: { policyId: "your-policy-id" } }
                    });
                    console.log('✅ Smart account client created');
                },
                'Setting up transaction client...',
                'Transaction client ready for gasless operations'
            );

            // Step 6: Finalize setup
            await accountProgress.runStep(
                'finalize',
                async () => {
                    console.log('Finalizing setup...');
                    console.log('🔄 Setting smartAccount:', !!account);
                    console.log('🔄 Setting smartAccountClient:', !!client);
                    console.log('🔄 Setting smartAccountAddress to:', account.address);

                    // Set state synchronously in one batch
                    console.log('🔧 About to sync state - before:', {
                        smartAccount: !!smartAccount,
                        smartAccountClient: !!smartAccountClient,
                        smartAccountAddress
                    });
                    console.log('🔧 About to sync state - new values:', {
                        account: !!account,
                        client: !!client,
                        address: account.address
                    });

                    // Use the new sync function to ensure refs and state are both updated
                    syncAccountState(account, client, account.address);

                    console.log('✅ Setup finalized - Smart Account Address:', account.address);
                    console.log('🔧 State sync calls completed, waiting for React update...');

                    // Wait for state updates to be processed
                    await new Promise(resolve => setTimeout(resolve, 100));

                    console.log('🔄 After timeout - checking both state and refs:', {
                        state: {
                            smartAccount: !!smartAccount,
                            smartAccountClient: !!smartAccountClient,
                            smartAccountAddress
                        },
                        refs: {
                            account: !!smartAccountRef.current,
                            client: !!smartAccountClientRef.current,
                            address: smartAccountAddressRef.current
                        }
                    });
                },
                'Completing initialization...',
                'Smart account is ready for use!'
            );

            // Success notification
            toast({
                title: 'Smart Account Created Successfully!',
                description: 'Your smart account is ready for gasless transactions',
                variant: 'success'
            });

        } catch (error) {
            console.error('Failed to create smart account:', error);

            const errorMessage = error instanceof Error ? error.message : 'Failed to create smart account';

            toast({
                title: 'Account Creation Failed',
                description: errorMessage,
                variant: 'error'
            });

            // The error is already handled by runStep, so we don't need to do anything else
        } finally {
            console.log('🏁 Account creation process finishing...');
            console.log('🏁 Before finishProcess - smartAccount exists:', !!smartAccount);
            console.log('🏁 Before finishProcess - smartAccountClient exists:', !!smartAccountClient);
            console.log('🏁 Before finishProcess - smartAccountAddress:', smartAccountAddress);

            console.log('🏁 About to call finishProcess...');
            accountProgress.finishProcess();
            console.log('🏁 finishProcess completed');

            console.log('🏁 About to setIsCreatingAccount(false)...');
            setIsCreatingAccount(false);
            console.log('🏁 setIsCreatingAccount(false) completed');

            console.log('🏁 After finishProcess - smartAccount exists:', !!smartAccount);
            console.log('🏁 After finishProcess - smartAccountClient exists:', !!smartAccountClient);
            console.log('🏁 After finishProcess - smartAccountAddress:', smartAccountAddress);

            // Add a delay to check state after React processes updates
            setTimeout(() => {
                console.log('🏁 FINAL STATE CHECK after React update cycle:');
                console.log('🏁 smartAccount exists:', !!smartAccount);
                console.log('🏁 smartAccountClient exists:', !!smartAccountClient);
                console.log('🏁 smartAccountAddress:', smartAccountAddress);
            }, 500);
        }
    }, [address, publicClient, walletClient, toast, accountProgress, syncAccountState]);

    // Execute single transaction - using ref pattern to avoid stale closures
    const executeTransaction = useCallback(async (params: ExecuteTransactionParams) => {
        // Get current state values directly, with refs as fallback
        const currentSmartAccount = smartAccount || smartAccountRef.current;
        const currentSmartAccountClient = smartAccountClient || smartAccountClientRef.current;
        const currentSmartAccountAddress = smartAccountAddress || smartAccountAddressRef.current;

        console.log('💸 executeTransaction called with:', {
            hasSmartAccount: !!currentSmartAccount,
            hasSmartAccountClient: !!currentSmartAccountClient,
            smartAccountAddress: currentSmartAccountAddress,
            params,
            accountType: currentSmartAccount ? typeof currentSmartAccount : 'null',
            clientType: currentSmartAccountClient ? typeof currentSmartAccountClient : 'null'
        });

        // Double check state right before the error
        console.log('💸 DETAILED STATE CHECK:', {
            smartAccount: currentSmartAccount,
            smartAccountClient: currentSmartAccountClient,
            smartAccountAddress: currentSmartAccountAddress,
            isConnected,
            address,
            isCreatingAccount
        });

        if (!currentSmartAccountClient || !currentSmartAccount) {
            console.error('❌ Smart account objects missing:', {
                smartAccount: !!currentSmartAccount,
                smartAccountClient: !!currentSmartAccountClient,
                smartAccountAddress: currentSmartAccountAddress,
                walletConnected: isConnected,
                currentAddress: address
            });

            // Try to provide helpful error message
            if (currentSmartAccountAddress && (!currentSmartAccount || !currentSmartAccountClient)) {
                console.error('❌ CRITICAL: Address exists but objects are missing - this indicates a state management bug');
            }

            throw new Error('Smart account not available');
        }

        setIsExecuting(true);
        try {
            // Execute transaction using Account Kit
            const result = await currentSmartAccountClient.sendUserOperation({
                calls: [{
                    target: params.target,
                    data: params.data || '0x',
                    value: BigInt(params.value || 0),
                }],
            });

            // Wait for transaction to be mined
            const txHash = await currentSmartAccountClient.waitForUserOperationTransaction({
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
            setIsExecuting(false);
        }
    }, [smartAccountClient, smartAccount, smartAccountAddress, toast, isConnected, address, isCreatingAccount]);

    // Execute batch transactions
    const executeBatchTransaction = useCallback(async (params: BatchExecuteParams) => {
        const currentSmartAccount = smartAccount || smartAccountRef.current;
        const currentSmartAccountClient = smartAccountClient || smartAccountClientRef.current;

        if (!currentSmartAccountClient || !currentSmartAccount) {
            throw new Error('Smart account not available');
        }

        setIsExecuting(true);
        try {
            // Execute batch transactions using Account Kit
            const batchCalls = params.transactions.map(tx => ({
                target: tx.target,
                data: tx.data || '0x',
                value: BigInt(tx.value || 0),
            }));

            const result = await currentSmartAccountClient.sendUserOperation({
                calls: batchCalls,
            });

            // Wait for transaction to be mined
            const txHash = await currentSmartAccountClient.waitForUserOperationTransaction({
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
            setIsExecuting(false);
        }
    }, [smartAccountClient, smartAccount, toast]);

    // Refresh account data
    const refreshData = useCallback(async () => {
        if (!smartAccount || !smartAccountClient || !publicClient) return;

        setIsLoading(true);
        try {
            // Fetch real account data using Account Kit
            const balance = await publicClient.getBalance({
                address: smartAccount.address,
            });

            let nonce = 0n;
            try {
                nonce = smartAccount.getNonce ? await smartAccount.getNonce() : 0n;
            } catch (err) {
                // fallback to direct contract read if needed
                try {
                    const contractNonce = await publicClient.readContract({
                        address: smartAccount.address,
                        abi: SmartAccountAbi,
                        functionName: 'nonce',
                    }) as bigint;
                    nonce = contractNonce;
                } catch (contractErr) {
                    nonce = 0n;
                }
            }

            // Check if account is deployed
            const code = await publicClient.getCode({
                address: smartAccount.address,
            });
            const isDeployed = code !== undefined && code !== '0x';

            const accountInfo: SmartAccountInfo = {
                address: smartAccount.address,
                owner: address || '',
                nonce: Number(nonce),
                isDeployed,
                balance: viem.formatEther(balance),
                modules: [] // TODO: Fetch installed modules if needed
            };

            setSmartAccountInfo(accountInfo);
        } catch (error) {
            console.error('Failed to refresh account data:', error);
            toast({
                title: 'Account Data Error',
                description: 'Could not fetch smart account info.',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [smartAccount, smartAccountClient, publicClient, address, toast]);

    // Monitor state changes for debugging
    useEffect(() => {
        console.log('🔍 STATE CHANGE DETECTED:', {
            smartAccount: !!smartAccount,
            smartAccountClient: !!smartAccountClient,
            smartAccountAddress: smartAccountAddress || 'empty',
            timestamp: new Date().toISOString()
        });
    }, [smartAccount, smartAccountClient, smartAccountAddress]);

    // Auto-refresh data when account changes
    useEffect(() => {
        if (smartAccount && smartAccountAddress) {
            console.log('🔄 Auto-refreshing data for smart account:', smartAccountAddress);
            refreshData();
        }
    }, [smartAccount, smartAccountAddress, refreshData]);

    // Check for an existing smart account on wallet connection
    useEffect(() => {
        if (isConnected && address && !smartAccount) {
            // TODO: Check if user already has a smart account
            // For now, we'll require manual creation
        }
    }, [isConnected, address, smartAccount]);

    // Remove duplicate fetchAccountData effect (all data is now in refreshData)
    // If you need to fetch info for a raw EOA, use this pattern:
    useEffect(() => {
        const fetchEOAData = async () => {
            if (!address || !publicClient) return;
            try {
                const balance = await publicClient.getBalance({address});
                const code = await publicClient.getCode({address});
                // Optionally set some state if needed
            } catch (err) {
                console.error("Error fetching EOA data:", err);
            }
        };
        fetchEOAData();
    }, [address, publicClient]);

    // Guardian address validation
    // Helper function to check if smart account is ready
    const isSmartAccountReady = () => {
        const account = smartAccount || smartAccountRef.current;
        const client = smartAccountClient || smartAccountClientRef.current;
        const address = smartAccountAddress || smartAccountAddressRef.current;
        return !!(account && client && address);
    };

    const handleAddGuardian = () => {
        if (!viem.isAddress(newGuardian)) {
            setError("Invalid Ethereum address");
            toast({
                title: "Invalid Address",
                description: "Please enter a valid Ethereum address.",
                variant: "error"
            });
            return;
        }
        setError('');
        // ...existing code for adding guardian...
    };

    // UserOperation submission with error handling
    const submitUserOperation = async (userOp: UserOperation) => {
        toast({
            title: "Not Implemented",
            description: "Bundler integration is not yet implemented.",
            variant: "error"
        });
        throw new Error("Bundler integration is not implemented.");
    };

    const hookReturn = {
        // Connection state
        isConnected,
        address,

        // Smart account objects
        smartAccount,
        smartAccountClient,

        // Smart account state
        smartAccountAddress,
        smartAccountInfo,
        isCreatingAccount,
        isExecuting,
        isLoading,

        // Derived state
        balance: smartAccountInfo?.balance,
        nonce: smartAccountInfo?.nonce,
        isDeployed: smartAccountInfo?.isDeployed,
        tokenBalances: [], // TODO: Implement token balance fetching
        paymasterDeposit: '0.1', // TODO: Fetch real paymaster deposit

        // Progress tracking
        creationProgress: accountProgress,

        // Actions
        createSmartAccount,
        executeTransaction,
        executeBatchTransaction,
        refreshData,
        handleAddGuardian,
        isSmartAccountReady,
        error,
        newGuardian,
        setNewGuardian,
        submitUserOperation
    };

    console.log('🪝 useSmartAccount hook returning:', {
        smartAccountAddress: hookReturn.smartAccountAddress,
        isCreatingAccount: hookReturn.isCreatingAccount,
        isConnected: hookReturn.isConnected,
        hasSmartAccount: !!hookReturn.smartAccount,
        hasSmartAccountClient: !!hookReturn.smartAccountClient,
        smartAccountExists: !!smartAccount,
        smartAccountClientExists: !!smartAccountClient,
        // Refs for debugging
        refValues: {
            accountRef: !!smartAccountRef.current,
            clientRef: !!smartAccountClientRef.current,
            addressRef: smartAccountAddressRef.current
        }
    });

    return hookReturn;
};
