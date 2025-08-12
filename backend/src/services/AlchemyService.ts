import {Address, createPublicClient, createWalletClient, encodePacked, Hash, Hex, http, keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {baseSepolia} from 'viem/chains';
import crypto from 'crypto';
import {config} from '../config';
import {createServiceLogger} from '../utils/logger';

const logger = createServiceLogger('AlchemyService');

export interface AlchemyConfig {
    apiKey: string;
    policyId?: string;
    chainId?: number;
}

export interface SmartAccount {
    address: Address;
    isDeployed: boolean;
    nonce: bigint;
    balance?: bigint;
}

export interface Transaction {
    to: Address;
    data?: Hex;
    value?: bigint;
}

export interface TransactionResult {
    hash: Hash;
    userOpHash?: Hash;
    success: boolean;
}

export interface User {
    email?: string;
    userId?: string;
}

interface UserOperation {
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

export class AlchemyService {
    private publicClient: any;
    private walletClient: any;
    private bundlerUrl: string;
    private paymasterUrl: string;
    private currentUser: User | null = null;
    private smartAccountAddress: Address | null = null;
    private ownerAccount: any = null;

    constructor() {
        // Use centralized config
        this.bundlerUrl = `https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`;
        this.paymasterUrl = `https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`;

        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(`https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`)
        });

        logger.info('AlchemyService initialized with centralized config', {
            hasApiKey: !!config.alchemy.apiKey,
            chainId: config.alchemy.chainId,
            hasPolicyId: !!config.alchemy.policyId
        });
    }

    async authenticate(email: string): Promise<{ success: boolean; data?: User; error?: string }> {
        try {
            const privateKey = this.generatePrivateKeyFromEmail(email);
            this.ownerAccount = privateKeyToAccount(privateKey);

            this.walletClient = createWalletClient({
                account: this.ownerAccount,
                chain: baseSepolia,
                transport: http(`https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`)
            });

            this.smartAccountAddress = await this.calculateSmartAccountAddress(this.ownerAccount.address);

            const user: User = {
                email,
                userId: `user_${Date.now()}`,
            };

            this.currentUser = user;
            logger.info('Authentication successful', {email, smartAccount: this.smartAccountAddress});

            return {success: true, data: user};
        } catch (error) {
            logger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
            return {success: false, error: error instanceof Error ? error.message : 'Authentication failed'};
        }
    }

    async getSmartAccountAddress(): Promise<{ success: boolean; data?: Address; error?: string }> {
        if (!this.smartAccountAddress) {
            return {success: false, error: 'No smart account address available'};
        }
        return {success: true, data: this.smartAccountAddress};
    }

    async getAccountInfo(): Promise<{ success: boolean; data?: SmartAccount; error?: string }> {
        try {
            if (!this.smartAccountAddress || !this.publicClient) {
                throw new Error('Smart account not initialized');
            }

            const [balance, bytecode] = await Promise.all([
                this.publicClient.getBalance({address: this.smartAccountAddress}),
                this.publicClient.getBytecode({address: this.smartAccountAddress}),
            ]);

            const isDeployed = !!bytecode && bytecode !== '0x';
            const nonce = BigInt(0); // Simplified nonce handling

            const accountInfo: SmartAccount = {
                address: this.smartAccountAddress,
                isDeployed,
                nonce,
                balance,
            };

            return {success: true, data: accountInfo};
        } catch (error) {
            logger.error('Failed to get account info', error instanceof Error ? error : new Error(String(error)));
            return {success: false, error: error instanceof Error ? error.message : 'Failed to get account info'};
        }
    }

    async sendTransaction(request: Transaction): Promise<{
        success: boolean;
        data?: TransactionResult;
        error?: string
    }> {
        try {
            if (!this.isAuthenticated() || !this.walletClient) {
                return {success: false, error: 'User not authenticated'};
            }

            const userOp = await this.buildUserOperation(request);

            // Log UserOp details before sending
            logger.info('Sending UserOperation to bundler', {
                sender: userOp.sender,
                nonce: userOp.nonce,
                initCode: userOp.initCode,
                callData: userOp.callData,
                callGasLimit: userOp.callGasLimit,
                verificationGasLimit: userOp.verificationGasLimit,
                preVerificationGas: userOp.preVerificationGas,
                maxFeePerGas: userOp.maxFeePerGas,
                maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
                paymasterAndData: userOp.paymasterAndData,
                signatureLength: userOp.signature.length,
                hasInitCode: userOp.initCode !== '0x',
                hasPaymaster: userOp.paymasterAndData !== '0x'
            });

            const userOpHash = await this.callBundlerAPI('eth_sendUserOperation', [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']);

            // Wait for confirmation
            let receipt = null;
            let attempts = 0;
            const maxAttempts = 30;

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
                throw new Error('Transaction not confirmed within timeout');
            }

            const result: TransactionResult = {
                hash: receipt.transactionHash,
                userOpHash: userOpHash,
                success: receipt.success || true,
            };

            logger.info('Transaction successful', result);
            return {success: true, data: result};

        } catch (error) {
            logger.error('Transaction failed', error instanceof Error ? error : new Error(String(error)));
            return {success: false, error: error instanceof Error ? error.message : 'Transaction failed'};
        }
    }

    async healthCheck(): Promise<{ success: boolean; data?: { isHealthy: boolean; latency: number }; error?: string }> {
        try {
            const startTime = Date.now();
            await this.publicClient.getBlockNumber();
            const latency = Date.now() - startTime;

            return {
                success: true,
                data: {isHealthy: true, latency}
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Health check failed'
            };
        }
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null && this.smartAccountAddress !== null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    logout(): void {
        this.currentUser = null;
        this.smartAccountAddress = null;
        this.ownerAccount = null;
        this.walletClient = null;
    }

    private async callBundlerAPI(method: string, params: any[]): Promise<any> {
        const requestBody = {
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
        };

        logger.debug('Bundler API request', {
            method,
            url: this.bundlerUrl,
            paramsCount: params.length,
            requestId: requestBody.id
        });

        const response = await fetch(this.bundlerUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Bundler API HTTP error', new Error(`${response.status} ${response.statusText}: ${errorText}`), {
                status: response.status,
                statusText: response.statusText,
                errorText,
                method
            });
            throw new Error(`Bundler API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (data.error) {
            logger.error('Bundler API error response', new Error(data.error.message), {
                method,
                error: data.error,
                errorCode: data.error.code,
                errorMessage: data.error.message,
                errorData: data.error.data
            });
            throw new Error(`Bundler API error: ${data.error.message}`);
        }

        logger.debug('Bundler API success', {
            method,
            resultType: typeof data.result,
            hasResult: !!data.result
        });

        return data.result;
    }

    private generatePrivateKeyFromEmail(email: string): `0x${string}` {
        const hash = crypto.createHash('sha256').update(email + 'nexus-wallet-salt').digest('hex');
        return `0x${hash}` as `0x${string}`;
    }

    private async calculateSmartAccountAddress(ownerAddress: Address): Promise<Address> {
        try {
            const SIMPLE_ACCOUNT_FACTORY = '0x9406Cc6185a346906296296840746125a0E44976454';
            const salt = 0;

            // Use readContract for better error handling and type safety
            const predictedAddress = await this.publicClient.readContract({
                address: SIMPLE_ACCOUNT_FACTORY,
                abi: [{
                    "inputs": [{"name": "owner", "type": "address"}, {"name": "salt", "type": "uint256"}],
                    "name": "getAddress",
                    "outputs": [{"name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                }],
                functionName: 'getAddress',
                args: [ownerAddress, salt]
            }) as Address;

            logger.debug('Smart account address calculated', {
                owner: ownerAddress,
                factory: SIMPLE_ACCOUNT_FACTORY,
                salt: salt.toString(),
                predictedAddress
            });

            return predictedAddress;
        } catch (error) {
            logger.warn('Address prediction failed, using fallback', error instanceof Error ? error : new Error(String(error)));

            // Fallback calculation - deterministic but may not match factory
            const hash = crypto.createHash('sha256')
                .update(ownerAddress + 'simple-account-factory-fallback')
                .digest('hex');
            return `0x${hash.slice(0, 40)}` as Address;
        }
    }

    private async buildUserOperation(request: Transaction): Promise<UserOperation> {
        if (!this.smartAccountAddress || !this.ownerAccount || !this.walletClient) {
            throw new Error('Smart account not properly initialized');
        }

        const bytecode = await this.publicClient.getBytecode({address: this.smartAccountAddress});
        const isDeployed = !!bytecode && bytecode !== '0x';
        const gasPrice = await this.publicClient.getGasPrice();

        // Get actual nonce from entry point
        const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
        let nonce: bigint;
        try {
            nonce = await this.publicClient.readContract({
                address: ENTRY_POINT,
                abi: [{
                    "inputs": [{"name": "sender", "type": "address"}, {"name": "key", "type": "uint192"}],
                    "name": "getNonce",
                    "outputs": [{"name": "nonce", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }],
                functionName: 'getNonce',
                args: [this.smartAccountAddress, BigInt(0)]
            });
        } catch (error) {
            logger.warn('Failed to get nonce from entry point, using 0', error);
            nonce = BigInt(0);
        }

        // Build initCode for undeployed accounts
        let initCode = '0x';
        if (!isDeployed) {
            // Use the correct SimpleAccount factory address for the chain
            const SIMPLE_ACCOUNT_FACTORY = '0x9406Cc6185a346906296296840746125a0E44976454';

            // createAccount(address owner, uint256 salt)
            const functionSelector = '0x5fbfb9cf'; // createAccount function selector
            const ownerParam = this.ownerAccount.address.slice(2).padStart(64, '0');
            const saltParam = BigInt(0).toString(16).padStart(64, '0');
            const factoryCalldata = functionSelector + ownerParam + saltParam;
            initCode = SIMPLE_ACCOUNT_FACTORY + factoryCalldata.slice(2);

            logger.debug('InitCode generated for undeployed account', {
                factory: SIMPLE_ACCOUNT_FACTORY,
                owner: this.ownerAccount.address,
                salt: '0',
                initCode,
                initCodeLength: initCode.length
            });
        }

        const userOp: UserOperation = {
            sender: this.smartAccountAddress,
            nonce: `0x${nonce.toString(16)}`,
            initCode,
            callData: request.data || '0x',
            callGasLimit: '0x55730',
            verificationGasLimit: '0x55730',
            preVerificationGas: '0x94A0',
            maxFeePerGas: `0x${gasPrice.toString(16)}`,
            maxPriorityFeePerGas: `0x${(gasPrice / BigInt(2)).toString(16)}`,
            paymasterAndData: '0x',
            signature: '0x',
        };

        // Get paymaster data if policy ID is configured
        if (config.alchemy.policyId) {
            try {
                logger.debug('Requesting paymaster data', {
                    policyId: config.alchemy.policyId,
                    userOpSender: userOp.sender
                });

                const paymasterData = await this.callPaymasterAPI('alchemy_requestPaymasterAndData', [{
                    policyId: config.alchemy.policyId,
                    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
                    userOperation: userOp
                }]);

                if (paymasterData && paymasterData.paymasterAndData) {
                    userOp.paymasterAndData = paymasterData.paymasterAndData;
                    logger.debug('Paymaster data received', {
                        paymasterAndDataLength: paymasterData.paymasterAndData.length,
                        hasPaymasterAndData: paymasterData.paymasterAndData !== '0x'
                    });
                }
            } catch (err) {
                logger.warn('Paymaster unavailable, user will pay gas', {
                    error: err instanceof Error ? err.message : String(err),
                    policyId: config.alchemy.policyId
                });
            }
        }

        // Sign the UserOperation with proper ERC-4337 format
        const userOpHash = this.getUserOperationHash(userOp);

        // For smart accounts, we need to sign the hash correctly
        // The signature needs to be in the format expected by the smart account
        try {
            // Sign the message hash (this creates a proper ECDSA signature)
            const signature = await this.walletClient.signMessage({
                message: {raw: userOpHash as `0x${string}`}
            });

            // For SimpleAccount, the signature format is just the raw ECDSA signature
            userOp.signature = signature;

            logger.debug('UserOp signature created', {
                userOpHash,
                signature,
                signatureLength: signature.length,
                sender: userOp.sender
            });
        } catch (error) {
            logger.error('Failed to sign UserOperation', error instanceof Error ? error : new Error(String(error)));
            throw new Error('UserOperation signing failed');
        }

        return userOp;
    }

    private async callPaymasterAPI(method: string, params: any[]): Promise<any> {
        const response = await fetch(this.paymasterUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
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

    private getUserOperationHash(userOp: UserOperation): string {
        const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
        const chainId = config.alchemy.chainId;

        // Pack UserOp according to ERC-4337 standard
        const packedUserOp = encodePacked(
            ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
            [
                userOp.sender as `0x${string}`,
                BigInt(userOp.nonce),
                keccak256(userOp.initCode as `0x${string}`),
                keccak256(userOp.callData as `0x${string}`),
                BigInt(userOp.callGasLimit),
                BigInt(userOp.verificationGasLimit),
                BigInt(userOp.preVerificationGas),
                BigInt(userOp.maxFeePerGas),
                BigInt(userOp.maxPriorityFeePerGas),
                keccak256(userOp.paymasterAndData as `0x${string}`)
            ]
        );

        const userOpHash = keccak256(packedUserOp);

        // Create final hash with entry point and chain ID
        const finalHash = keccak256(encodePacked(
            ['bytes32', 'address', 'uint256'],
            [userOpHash, ENTRY_POINT as `0x${string}`, BigInt(chainId)]
        ));

        logger.debug('UserOp hash calculation', {
            userOpHash,
            finalHash,
            chainId,
            entryPoint: ENTRY_POINT,
            sender: userOp.sender,
            nonce: userOp.nonce
        });

        return finalHash;
    }
}
