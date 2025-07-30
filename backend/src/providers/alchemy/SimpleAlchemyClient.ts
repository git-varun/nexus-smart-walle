import {Address, Hash, Hex} from 'viem';
import {createPublicClient, http, createWalletClient} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {baseSepolia} from 'viem/chains';
import crypto from 'crypto';

export interface AlchemyClientConfig {
    apiKey: string;
    policyId?: string;
    chainId?: number;
    gasManagerConfig?: {
        policyId: string;
    };
}

export interface SmartAccountInfo {
    address: Address;
    isDeployed: boolean;
    nonce: bigint;
    balance?: bigint;
}

export interface TransactionRequest {
    to: Address;
    data?: Hex;
    value?: bigint;
}

export interface TransactionResult {
    hash: Hash;
    userOpHash?: Hash;
    success: boolean;
    receipt?: any;
}

export interface ServiceResponse<T> {
    data: T;
    success: boolean;
    error?: {
        code: string;
        message: string;
    };
    metadata?: {
        service: string;
        timestamp: number;
        [key: string]: any;
    };
}

export interface User {
    email?: string;
    userId?: string;
}

export enum AlchemySignerStatus {
    INITIALIZING = 'initializing',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
}

export interface AlchemySignerParams {
    type: 'email' | 'passkey' | 'google' | 'facebook';
    email?: string;
    redirectURI?: string;
}

// Alchemy Bundler API interfaces
interface UserOperation {
    sender: Address;
    nonce: bigint;
    initCode: Hex;
    callData: Hex;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    paymasterAndData: Hex;
    signature: Hex;
}

interface UserOperationRequest {
    sender: Address;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string;
    signature: string;
}

export class SimpleAlchemyClient {
    private config: AlchemyClientConfig;
    private publicClient: any;
    private walletClient: any;
    private bundlerUrl: string;
    private paymasterUrl: string;
    private signerStatus: AlchemySignerStatus = AlchemySignerStatus.INITIALIZING;
    private currentUser: User | null = null;
    private initialized = false;
    private smartAccountAddress: Address | null = null;
    private ownerAccount: any = null;

    constructor(config: AlchemyClientConfig) {
        this.config = config;
        this.bundlerUrl = `https://base-sepolia.g.alchemy.com/v2/${config.apiKey}`;
        this.paymasterUrl = `https://base-sepolia.g.alchemy.com/v2/${config.apiKey}`;
        this.initialize();
    }


    private async initialize() {
        try {
            console.log('🔧 Initializing Direct Alchemy Bundler API Client...');

            // Create public client for Base Sepolia
            this.publicClient = createPublicClient({
                chain: baseSepolia,
                transport: http(`https://base-sepolia.g.alchemy.com/v2/${this.config.apiKey}`)
            });

            this.initialized = true;
            this.signerStatus = AlchemySignerStatus.DISCONNECTED;

            console.log('✅ Direct Alchemy Bundler API Client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Alchemy Client:', error);
            throw error;
        }
    }

    // Helper method to call Alchemy Bundler API
    private async callBundlerAPI(method: string, params: any[]): Promise<any> {
        const response = await fetch(this.bundlerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        if (!response.ok) {
            throw new Error(`Bundler API call failed: ${response.statusText}`);
        }

        const data = await response.json() as any;
        if (data.error) {
            throw new Error(`Bundler API error: ${data.error.message}`);
        }

        return data.result;
    }

    // Helper method to call Alchemy Paymaster API
    private async callPaymasterAPI(method: string, params: any[]): Promise<any> {
        const response = await fetch(this.paymasterUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        if (!response.ok) {
            throw new Error(`Paymaster API call failed: ${response.statusText}`);
        }

        const data = await response.json() as any;
        if (data.error) {
            throw new Error(`Paymaster API error: ${data.error.message}`);
        }

        return data.result;
    }

    // Generate deterministic private key from email for demo purposes
    private generatePrivateKeyFromEmail(email: string): `0x${string}` {
        const hash = crypto.createHash('sha256').update(email + 'nexus-wallet-salt').digest('hex');
        return `0x${hash}` as `0x${string}`;
    }

    // Calculate smart account address using CREATE2
    private calculateSmartAccountAddress(ownerAddress: Address): Address {
        // Simple deterministic address generation for demo
        // In production, this would use the actual SimpleAccount factory and CREATE2
        const hash = crypto.createHash('sha256')
            .update(ownerAddress + 'simple-account-factory')
            .digest('hex');
        return `0x${hash.slice(0, 40)}` as Address;
    }

    async authenticate(params: AlchemySignerParams): Promise<ServiceResponse<User>> {
        try {
            console.log('🔐 Authenticating with Direct Alchemy API...');

            if (params.type === 'email' && params.email) {
                // Generate deterministic private key from email
                const privateKey = this.generatePrivateKeyFromEmail(params.email);

                // Create owner account from private key
                this.ownerAccount = privateKeyToAccount(privateKey);

                // Create wallet client for signing
                this.walletClient = createWalletClient({
                    account: this.ownerAccount,
                    chain: baseSepolia,
                    transport: http(`https://base-sepolia.g.alchemy.com/v2/${this.config.apiKey}`)
                });

                // Calculate smart account address
                this.smartAccountAddress = this.calculateSmartAccountAddress(this.ownerAccount.address);

                const user: User = {
                    email: params.email,
                    userId: `user_${Date.now()}`,
                };

                this.currentUser = user;
                this.signerStatus = AlchemySignerStatus.CONNECTED;

                console.log('✅ Direct Alchemy API authentication successful:', this.smartAccountAddress);

                return {
                    data: user,
                    success: true,
                    metadata: {
                        service: 'alchemy-client',
                        timestamp: Date.now(),
                        smartAccountAddress: this.smartAccountAddress,
                        ownerAddress: this.ownerAccount.address,
                    },
                };
            } else {
                throw new Error('Only email authentication is supported');
            }
        } catch (error) {
            console.error('❌ Authentication failed:', error);

            return {
                data: null as any,
                success: false,
                error: {
                    code: 'AUTH_FAILED',
                    message: error instanceof Error ? error.message : 'Authentication failed',
                },
            };
        }
    }

    async logout(): Promise<ServiceResponse<void>> {
        try {
            this.currentUser = null;
            this.signerStatus = AlchemySignerStatus.DISCONNECTED;
            this.smartAccountAddress = null;
            this.ownerAccount = null;
            this.walletClient = null;

            return {
                data: undefined,
                success: true,
                metadata: {
                    service: 'alchemy-client',
                    timestamp: Date.now(),
                },
            };
        } catch (error) {
            return {
                data: undefined,
                success: false,
                error: {
                    code: 'LOGOUT_FAILED',
                    message: error instanceof Error ? error.message : 'Logout failed',
                },
            };
        }
    }

    async getSmartAccountAddress(): Promise<ServiceResponse<Address>> {
        try {
            if (!this.smartAccountAddress) {
                throw new Error('No smart account address available');
            }

            return {
                data: this.smartAccountAddress,
                success: true,
                metadata: {
                    service: 'alchemy-client',
                    timestamp: Date.now(),
                },
            };
        } catch (error) {
            return {
                data: null as any,
                success: false,
                error: {
                    code: 'ADDRESS_FETCH_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to get address',
                },
            };
        }
    }

    async getAccountInfo(): Promise<ServiceResponse<SmartAccountInfo>> {
        try {
            if (!this.smartAccountAddress || !this.publicClient) {
                throw new Error('Smart account not initialized');
            }

            const [balance, bytecode] = await Promise.all([
                this.publicClient.getBalance({address: this.smartAccountAddress}),
                this.publicClient.getBytecode({address: this.smartAccountAddress}),
            ]);

            const isDeployed = !!bytecode && bytecode !== '0x';

            // Get nonce from bundler if deployed, otherwise 0
            let nonce = BigInt(0);
            if (isDeployed) {
                try {
                    nonce = BigInt(await this.callBundlerAPI('eth_getUserOperationReceipt', [this.smartAccountAddress]) || 0);
                } catch (err) {
                    // If nonce call fails, use 0
                    nonce = BigInt(0);
                }
            }

            const accountInfo: SmartAccountInfo = {
                address: this.smartAccountAddress,
                isDeployed,
                nonce,
                balance,
            };

            return {
                data: accountInfo,
                success: true,
                metadata: {
                    service: 'alchemy-client',
                    timestamp: Date.now(),
                },
            };
        } catch (error) {
            return {
                data: null as any,
                success: false,
                error: {
                    code: 'ACCOUNT_INFO_FAILED',
                    message: error instanceof Error ? error.message : 'Failed to get account info',
                },
            };
        }
    }

    // Build and sign UserOperation
    private async buildUserOperation(request: TransactionRequest): Promise<UserOperationRequest> {
        if (!this.smartAccountAddress || !this.ownerAccount || !this.walletClient) {
            throw new Error('Smart account not properly initialized');
        }

        // Get gas prices
        const gasPrice = await this.publicClient.getGasPrice();

        // Build calldata for the transaction
        const callData = request.data || '0x';

        // Build UserOperation
        const userOp: UserOperationRequest = {
            sender: this.smartAccountAddress,
            nonce: '0x0', // Will be filled by bundler
            initCode: '0x', // Account deployment code if needed
            callData,
            callGasLimit: '0x55730', // 350000 gas limit
            verificationGasLimit: '0x55730', // 350000 gas limit
            preVerificationGas: '0x5208', // 21000 pre-verification gas
            maxFeePerGas: `0x${gasPrice.toString(16)}`,
            maxPriorityFeePerGas: `0x${(gasPrice / BigInt(2)).toString(16)}`,
            paymasterAndData: '0x', // Will be filled by paymaster if available
            signature: '0x', // Will be filled after signing
        };

        // Get paymaster data if gas manager is configured
        if (this.config.gasManagerConfig?.policyId) {
            try {
                const paymasterData = await this.callPaymasterAPI('alchemy_requestPaymasterAndData', [
                    userOp,
                    this.config.gasManagerConfig.policyId
                ]);

                if (paymasterData && paymasterData.paymasterAndData) {
                    userOp.paymasterAndData = paymasterData.paymasterAndData;
                }
            } catch (err) {
                console.warn('Paymaster unavailable, user will pay gas:', err);
            }
        }

        // Sign the UserOperation
        const userOpHash = await this.callBundlerAPI('eth_getUserOperationByHash', [userOp]);
        const signature = await this.walletClient.signMessage({
            message: {raw: userOpHash as `0x${string}`}
        });

        userOp.signature = signature;

        return userOp;
    }

    async sendTransaction(request: TransactionRequest): Promise<ServiceResponse<TransactionResult>> {
        try {
            console.log('💸 Processing Real Alchemy Bundler transaction:', request);

            if (!this.isAuthenticated() || !this.walletClient) {
                return {
                    data: null as any,
                    success: false,
                    error: {
                        code: 'TRANSACTION_FAILED',
                        message: 'User not authenticated or wallet client not ready',
                    },
                };
            }

            // Build and sign UserOperation
            const userOp = await this.buildUserOperation(request);

            console.log('📦 Built UserOperation:', userOp);

            // Submit UserOperation to Alchemy bundler
            const userOpHash = await this.callBundlerAPI('eth_sendUserOperation', [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']);

            console.log('📤 UserOperation sent to Alchemy bundler:', userOpHash);

            // Wait for UserOperation to be included in a transaction
            let receipt = null;
            let attempts = 0;
            const maxAttempts = 30; // Wait up to 30 seconds

            while (!receipt && attempts < maxAttempts) {
                try {
                    receipt = await this.callBundlerAPI('eth_getUserOperationReceipt', [userOpHash]);
                    if (!receipt) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        attempts++;
                    }
                } catch (err) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                }
            }

            if (!receipt) {
                throw new Error('UserOperation not confirmed within timeout period');
            }

            console.log('⏳ UserOperation confirmed:', receipt);

            // Get the actual transaction hash from the receipt
            const transactionHash = receipt.transactionHash;

            // Get full transaction receipt
            const txReceipt = await this.publicClient.getTransactionReceipt({
                hash: transactionHash,
            });

            const result: TransactionResult = {
                hash: transactionHash,
                userOpHash: userOpHash,
                success: receipt.success || txReceipt.status === 'success',
                receipt: {
                    ...txReceipt,
                    gasUsed: txReceipt.gasUsed?.toString(),
                },
            };

            console.log('✅ Real Alchemy bundler transaction successful:', result);

            return {
                data: result,
                success: true,
                metadata: {
                    service: 'alchemy-client',
                    timestamp: Date.now(),
                    userOpHash: userOpHash,
                    gasUsed: txReceipt.gasUsed?.toString(),
                    bundlerUsed: true,
                },
            };
        } catch (error) {
            console.error('❌ Real Alchemy bundler transaction failed:', error);

            return {
                data: null as any,
                success: false,
                error: {
                    code: 'TRANSACTION_FAILED',
                    message: error instanceof Error ? error.message : 'Transaction failed',
                },
            };
        }
    }

    async healthCheck(): Promise<ServiceResponse<{
        isHealthy: boolean;
        lastChecked: number;
        latency: number;
    }>> {
        try {
            const startTime = Date.now();
            await this.publicClient.getBlockNumber();
            const latency = Date.now() - startTime;

            return {
                data: {
                    isHealthy: true,
                    lastChecked: Date.now(),
                    latency,
                },
                success: true,
                metadata: {
                    service: 'alchemy-client',
                    timestamp: Date.now(),
                },
            };
        } catch (error) {
            return {
                data: {
                    isHealthy: false,
                    lastChecked: Date.now(),
                    latency: 0,
                },
                success: false,
                error: {
                    code: 'HEALTH_CHECK_FAILED',
                    message: error instanceof Error ? error.message : 'Health check failed',
                },
            };
        }
    }

    isAuthenticated(): boolean {
        return this.signerStatus === AlchemySignerStatus.CONNECTED && this.currentUser !== null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    getSignerStatus(): AlchemySignerStatus {
        return this.signerStatus;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    destroy(): void {
        this.currentUser = null;
        this.signerStatus = AlchemySignerStatus.DISCONNECTED;
        this.initialized = false;
        this.smartAccountAddress = null;
        this.ownerAccount = null;
        this.walletClient = null;
    }

    getConfig(): AlchemyClientConfig {
        return this.config;
    }

    getPublicClient(): any {
        return this.publicClient;
    }

    getWalletClient(): any {
        return this.walletClient;
    }
}
