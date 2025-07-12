// contracts/scripts/alchemy-bundler.ts
import {AlchemyProvider} from "@alchemy/aa-accounts";
import {createAlchemyPublicRpcClient, createModularAccountAlchemyClient} from "@alchemy/aa-alchemy";
import {baseSepolia, sepolia} from "viem/chains";
import {UserOperationStruct} from "./userOp-utils";
import {ethers} from "hardhat";

/**
 * Alchemy Bundler Integration
 */

export class AlchemyBundlerService {
    private alchemyClient: any;
    private provider: AlchemyProvider;
    private apiKey: string;
    private chain: any;

    constructor(apiKey: string, network: "base-sepolia" | "sepolia" = "base-sepolia") {
        this.apiKey = apiKey;
        this.chain = network === "base-sepolia" ? baseSepolia : sepolia;

        // Initialize Alchemy client
        this.alchemyClient = createAlchemyPublicRpcClient({
            connectionConfig:{apiKey: this.apiKey},
            chain: this.chain,
        });

        // Initialize provider
        this.provider = new AlchemyProvider({
            apiKey: this.apiKey,
            chain: this.chain,
            rpcUrl: `https://${this.chain.name.toLowerCase().replace(" ", "-")}.g.alchemy.com/v2/${this.apiKey}`
        });
    }

    /**
     * Get supported EntryPoint address
     */
    async getEntryPointAddress(): Promise<string> {
        try {
            const entryPoints = await this.alchemyClient.request({
                method: "eth_supportedEntryPoints",
                params: []
            });

            // Return the first supported EntryPoint (usually v0.6.0)
            return entryPoints[0] || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
        } catch (error) {
            console.error("Failed to get EntryPoint:", error);
            return "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // Default v0.6.0
        }
    }

    /**
     * Get bundler client info
     */
    async getBundlerInfo(): Promise<any> {
        try {
            const chainId = await this.alchemyClient.request({
                method: "eth_chainId",
                params: []
            });

            const entryPoints = await this.alchemyClient.request({
                method: "eth_supportedEntryPoints",
                params: []
            });

            return {
                chainId,
                entryPoints,
                network: this.chain.name
            };
        } catch (error) {
            console.error("Failed to get bundler info:", error);
            throw error;
        }
    }

    /**
     * Create smart account using Alchemy's modular account
     */
    async createSmartAccount(ownerAddress: string): Promise<{
        accountAddress: string;
        client: any;
    }> {
        try {
            const client = await createModularAccountAlchemyClient({
                apiKey: this.apiKey,
                chain: this.chain,
                signer: {
                    type: "local",
                    privateKey: process.env.PRIVATE_KEY as `0x${string}` // This would be the owner's key
                }
            });

            const accountAddress = await client.getAddress();

            return {
                accountAddress,
                client
            };
        } catch (error) {
            console.error("Failed to create smart account:", error);
            throw error;
        }
    }

    /**
     * Send transaction through smart account
     */
    async sendTransaction(
        client: any,
        to: string,
        value: bigint = 0n,
        data: string = "0x"
    ): Promise<string> {
        try {
            const result = await client.sendUserOperation({
                uo: {
                    target: to,
                    data: data,
                    value: value
                }
            });

            return result.hash;
        } catch (error) {
            console.error("Failed to send transaction:", error);
            throw error;
        }
    }

    /**
     * Batch transactions
     */
    async sendBatchTransactions(
        client: any,
        transactions: Array<{
            to: string;
            value?: bigint;
            data?: string;
        }>
    ): Promise<string> {
        try {
            const userOperations = transactions.map(tx => ({
                target: tx.to,
                data: tx.data || "0x",
                value: tx.value || 0n
            }));

            const result = await client.sendUserOperation({
                uo: userOperations
            });

            return result.hash;
        } catch (error) {
            console.error("Failed to send batch transactions:", error);
            throw error;
        }
    }

    // Add these missing methods to the AlchemyBundlerService class in alchemy-bundler.ts

    /**
     * Send UserOperation to bundler
     */
    async sendUserOperation(userOp: UserOperationStruct): Promise<string> {
        try {
            const result = await this.alchemyClient.request({
                method: "eth_sendUserOperation",
                params: [userOp, await this.getEntryPointAddress()]
            });

            console.log("UserOperation sent:", result);
            return result;
        } catch (error) {
            console.error("Failed to send UserOperation:", error);
            throw error;
        }
    }

    /**
     * Get UserOperation receipt
     */
    async getUserOperationReceipt(userOpHash: string): Promise<any> {
        try {
            const receipt = await this.alchemyClient.request({
                method: "eth_getUserOperationReceipt",
                params: [userOpHash]
            });

            return receipt;
        } catch (error) {
            console.error("Failed to get UserOperation receipt:", error);
            throw error;
        }
    }

    /**
     * Wait for UserOperation to be mined
     */
    async waitForUserOperation(
        userOpHash: string,
        timeout: number = 60000
    ): Promise<any> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                const receipt = await this.getUserOperationReceipt(userOpHash);
                if (receipt) {
                    return receipt;
                }
            } catch (error) {
                // Receipt not yet available
            }

            // Wait 2 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error("UserOperation timeout");
    }

    /**
     * Estimate UserOperation gas
     */
    async estimateUserOperationGas(userOp: Partial<UserOperationStruct>): Promise<{
        callGasLimit: string;
        verificationGasLimit: string;
        preVerificationGas: string;
    }> {
        try {
            const estimates = await this.alchemyClient.request({
                method: "eth_estimateUserOperationGas",
                params: [userOp, await this.getEntryPointAddress()]
            });

            return {
                callGasLimit: estimates.callGasLimit,
                verificationGasLimit: estimates.verificationGasLimit,
                preVerificationGas: estimates.preVerificationGas,
            };
        } catch (error) {
            console.error("Failed to estimate gas:", error);
            // Return defaults
            return {
                callGasLimit: "100000",
                verificationGasLimit: "150000",
                preVerificationGas: "21000",
            };
        }
    }

    /**
     * Get bundler status and health
     */
    async getBundlerStatus(): Promise<{
        isHealthy: boolean;
        chainId: string;
        entryPoints: string[];
        version?: string;
    }> {
        try {
            const [chainId, entryPoints] = await Promise.all([
                this.alchemyClient.request({method: "eth_chainId", params: []}),
                this.alchemyClient.request({method: "eth_supportedEntryPoints", params: []})
            ]);

            return {
                isHealthy: true,
                chainId,
                entryPoints,
                version: "1.0.0"
            };
        } catch (error) {
            console.error("Failed to get bundler status:", error);
            return {
                isHealthy: false,
                chainId: "unknown",
                entryPoints: []
            };
        }
    }

    /**
     * Get UserOperation by hash (if supported)
     */
    async getUserOperation(userOpHash: string): Promise<any> {
        try {
            const userOp = await this.alchemyClient.request({
                method: "eth_getUserOperationByHash",
                params: [userOpHash]
            });

            return userOp;
        } catch (error) {
            console.error("Failed to get UserOperation:", error);
            return null;
        }
    }

    /**
     * Send multiple UserOperations in batch
     */
    async sendUserOperationBatch(userOps: UserOperationStruct[]): Promise<string[]> {
        const results: string[] = [];

        try {
            // Send all UserOps concurrently
            const promises = userOps.map(userOp => this.sendUserOperation(userOp));
            const hashes = await Promise.all(promises);

            return hashes;
        } catch (error) {
            console.error("Failed to send UserOperation batch:", error);
            throw error;
        }
    }

    /**
     * Monitor UserOperation status with real-time updates
     */
    async monitorUserOperation(
        userOpHash: string,
        onStatusUpdate?: (status: string, receipt?: any) => void,
        timeout: number = 120000
    ): Promise<any> {
        const startTime = Date.now();
        let lastStatus = "pending";

        if (onStatusUpdate) {
            onStatusUpdate("submitted");
        }

        while (Date.now() - startTime < timeout) {
            try {
                const receipt = await this.getUserOperationReceipt(userOpHash);

                if (receipt) {
                    const status = receipt.success ? "success" : "failed";
                    if (status !== lastStatus && onStatusUpdate) {
                        onStatusUpdate(status, receipt);
                    }
                    return receipt;
                } else {
                    // Check if UserOp exists in mempool
                    const userOp = await this.getUserOperation(userOpHash);
                    const currentStatus = userOp ? "mempool" : "pending";

                    if (currentStatus !== lastStatus && onStatusUpdate) {
                        onStatusUpdate(currentStatus);
                        lastStatus = currentStatus;
                    }
                }
            } catch (error) {
                // Continue monitoring
            }

            // Wait 3 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if (onStatusUpdate) {
            onStatusUpdate("timeout");
        }
        throw new Error(`UserOperation monitoring timeout after ${timeout}ms`);
    }

    /**
     * Get gas prices with bundler-specific optimizations
     */
    async getOptimizedGasPrices(): Promise<{
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        gasPrice: string;
    }> {
        try {
            const [feeData, gasPrice] = await Promise.all([
                this.alchemyClient.request({method: "eth_feeHistory", params: ["0x4", "latest", [25, 50, 75]]}),
                this.alchemyClient.request({method: "eth_gasPrice", params: []})
            ]);

            // Calculate optimized fees based on recent history
            const baseFee = feeData.baseFeePerGas?.[feeData.baseFeePerGas.length - 1];
            const priorityFees = feeData.reward?.[feeData.reward.length - 1];

            const maxPriorityFeePerGas = priorityFees?.[1] || "0x5f5e100"; // 100M gwei default
            const maxFeePerGas = baseFee ?
                (BigInt(baseFee) * 2n + BigInt(maxPriorityFeePerGas)).toString() :
                gasPrice;

            return {
                maxFeePerGas,
                maxPriorityFeePerGas,
                gasPrice
            };
        } catch (error) {
            console.error("Failed to get optimized gas prices:", error);
            // Return safe defaults
            return {
                maxFeePerGas: "0x4a817c800", // 20 gwei
                maxPriorityFeePerGas: "0x77359400", // 2 gwei
                gasPrice: "0x4a817c800" // 20 gwei
            };
        }
    }

    /**
     * Validate UserOperation before sending
     */
    async validateUserOperation(userOp: UserOperationStruct): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Basic validation
            if (!userOp.sender || userOp.sender === "0x") {
                errors.push("Invalid sender address");
            }

            if (!userOp.callData || userOp.callData === "0x") {
                warnings.push("Empty callData - no operation will be performed");
            }

            if (BigInt(userOp.callGasLimit) < 21000n) {
                warnings.push("callGasLimit might be too low");
            }

            if (BigInt(userOp.verificationGasLimit) < 100000n) {
                warnings.push("verificationGasLimit might be too low");
            }

            // Try to simulate the UserOperation
            try {
                await this.alchemyClient.request({
                    method: "eth_estimateUserOperationGas",
                    params: [userOp, await this.getEntryPointAddress()]
                });
            } catch (simulationError) {
                // @ts-ignore
                errors.push(`Simulation failed: ${simulationError.message}`);
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            // @ts-ignore
            errors.push(`Validation error: ${error.message}`);
            return {
                isValid: false,
                errors,
                warnings
            };
        }
    }

    /**
     * Get account nonce from bundler
     */
    async getAccountNonce(accountAddress: string, key: string = "0x0"): Promise<string> {
        try {
            const nonce = await this.alchemyClient.request({
                method: "eth_getAccountNonce",
                params: [accountAddress, key]
            });

            return nonce;
        } catch (error) {
            console.error("Failed to get account nonce:", error);
            // Fallback to EntryPoint nonce
            try {
                const entryPoint = new ethers.Contract(
                    await this.getEntryPointAddress(),
                    ["function getNonce(address sender, uint192 key) view returns (uint256)"],
                    this.alchemyClient
                );

                const nonce = await entryPoint.getNonce(accountAddress, key);
                return nonce.toString();
            } catch (fallbackError) {
                console.error("Fallback nonce fetch failed:", fallbackError);
                return "0";
            }
        }
    }

    /**
     * Get bundler configuration and capabilities
     */
    async getBundlerCapabilities(): Promise<{
        maxBundleSize: number;
        supportedEntryPoints: string[];
        supportedChains: number[];
        features: string[];
    }> {
        try {
            const [entryPoints, chainId] = await Promise.all([
                this.alchemyClient.request({method: "eth_supportedEntryPoints", params: []}),
                this.alchemyClient.request({method: "eth_chainId", params: []})
            ]);

            return {
                maxBundleSize: 10, // Typical bundler limit
                supportedEntryPoints: entryPoints,
                supportedChains: [parseInt(chainId, 16)],
                features: [
                    "userOperation_v0.6",
                    "bundling",
                    "gasEstimation",
                    "simulation",
                    "mempool"
                ]
            };
        } catch (error) {
            console.error("Failed to get bundler capabilities:", error);
            return {
                maxBundleSize: 1,
                supportedEntryPoints: ["0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"],
                supportedChains: [84532], // Base Sepolia
                features: ["basic"]
            };
        }
    }
}
