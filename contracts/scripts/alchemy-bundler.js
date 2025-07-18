// contracts/scripts/alchemy-bundler.js
const {createSmartAccountClient, getBundlerClient} = require("@aa-sdk/core");
const {AlchemyTransport} = require("@account-kit/infra");
const {baseSepolia, sepolia} = require("viem/chains");
const {http} = require("viem");
const hre = require("hardhat");

const {ethers} = hre;

/**
 * Alchemy Bundler Integration
 */

class AlchemyBundlerService {
    constructor(apiKey, network = "base-sepolia") {
        this.apiKey = apiKey;
        this.chain = network === "base-sepolia" ? baseSepolia : sepolia;

        // Initialize Alchemy client with new transport
        this.alchemyClient = getBundlerClient({
            transport: http(`https://${this.chain.name.toLowerCase().replace(" ", "-")}.g.alchemy.com/v2/${this.apiKey}`),
            chain: this.chain,
        });

        // Initialize provider
        this.provider = {
            apiKey: this.apiKey,
            chain: this.chain,
            rpcUrl: `https://${this.chain.name.toLowerCase().replace(" ", "-")}.g.alchemy.com/v2/${this.apiKey}`
        };
    }

    /**
     * Get supported EntryPoint address
     */
    async getEntryPointAddress() {
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
    async getBundlerInfo() {
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
            console.error("Didn't get bundler info:", error);
            throw error;
        }
    }

    /**
     * Create smart account using Alchemy's modular account
     */
    async createSmartAccount(ownerAddress) {
        try {
            const client = createSmartAccountClient({
                transport: AlchemyTransport.fromAlchemyApiKey({
                    apiKey: this.apiKey,
                    chain: this.chain,
                }),
                chain: this.chain,
                // Note: Account creation should be handled separately with proper signer
            });

            const accountAddress = client.account?.address || "";

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
    async sendTransaction(client, to, value = BigInt(0), data = "0x") {
        try {
            const result = await client.sendUserOperation({
                account: client.account,
                calls: [{
                    target: to,
                    data: data,
                    value: value
                }]
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
    async sendBatchTransactions(client, transactions) {
        try {
            const calls = transactions.map(tx => ({
                target: tx.to,
                data: tx.data || "0x",
                value: tx.value || BigInt(0)
            }));

            const result = await client.sendUserOperation({
                account: client.account,
                calls: calls
            });

            return result.hash;
        } catch (error) {
            console.error("Failed to send batch transactions:", error);
            throw error;
        }
    }

    /**
     * Send UserOperation to bundler
     */
    async sendUserOperation(userOp) {
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
    async getUserOperationReceipt(userOpHash) {
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
    async waitForUserOperation(userOpHash, timeout = 60000) {
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
    async estimateUserOperationGas(userOp) {
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
    async getBundlerStatus() {
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
     * Get account nonce from bundler
     */
    async getAccountNonce(accountAddress, key = "0x0") {
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
}

module.exports = {
    AlchemyBundlerService
};
