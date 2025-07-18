// contracts/scripts/paymaster-utils.js
const hre = require("hardhat");

const {ethers} = hre;

/**
 * Paymaster utilities for gas sponsorship
 */

class PaymasterService {
    constructor(paymasterAddress, signer, provider) {
        this.signer = signer;
        this.provider = provider;
        this.paymaster = new ethers.Contract(
            paymasterAddress,
            [
                "function getHash(bytes32 userOpHash, uint48 validUntil, uint48 validAfter) view returns (bytes32)",
                "function verifyingSigner() view returns (address)",
                "function getDeposit(address account) view returns (uint256)",
                "function addDepositFor(address account) payable",
                "function parsePaymasterAndData(bytes calldata) pure returns (uint48, uint48, bytes calldata)"
            ],
            provider
        );
    }

    /**
     * Generate paymaster signature for UserOperation
     */
    async generatePaymasterSignature(userOpHash, validUntil, validAfter) {
        const now = Math.floor(Date.now() / 1000);
        const finalValidAfter = validAfter || now;
        const finalValidUntil = validUntil || (now + 3600); // 1 hour from now

        // Get the hash that needs to be signed
        const hashToSign = await this.paymaster.getHash(
            userOpHash,
            finalValidUntil,
            finalValidAfter
        );

        // Sign the hash
        const signature = await this.signer.signMessage(ethers.getBytes(hashToSign));

        return {
            signature,
            validUntil: finalValidUntil,
            validAfter: finalValidAfter
        };
    }

    /**
     * Check if account has sufficient deposit
     */
    async checkDeposit(accountAddress) {
        const depositAmount = await this.paymaster.getDeposit(accountAddress);
        const minimumDeposit = ethers.parseEther("0.01"); // 0.01 ETH minimum

        return {
            hasDeposit: depositAmount > BigInt(0),
            depositAmount,
            isInsufficient: depositAmount < minimumDeposit
        };
    }

    /**
     * Add deposit for account
     */
    async addDeposit(accountAddress, amount) {
        const tx = await this.paymaster.addDepositFor(accountAddress, {value: amount});
        return tx.hash;
    }

    /**
     * Get paymaster info
     */
    async getPaymasterInfo() {
        const verifyingSigner = await this.paymaster.verifyingSigner();
        const paymasterBalance = await this.provider.getBalance(await this.paymaster.getAddress());

        return {
            verifyingSigner,
            paymasterBalance,
            address: this.paymaster.address
        };
    }

    /**
     * Create complete paymaster data
     */
    async createPaymasterData(userOpHash, validUntil, validAfter) {
        const {signature, validUntil: finalValidUntil, validAfter: finalValidAfter} =
            await this.generatePaymasterSignature(userOpHash, validUntil, validAfter);

        const paymasterAddress = await this.paymaster.getAddress();

        // Pack the paymaster data
        const validUntilBytes = ethers.zeroPadValue(ethers.toBeHex(finalValidUntil), 6);
        const validAfterBytes = ethers.zeroPadValue(ethers.toBeHex(finalValidAfter), 6);

        return ethers.concat([
            paymasterAddress,
            validUntilBytes,
            validAfterBytes,
            signature
        ]);
    }

    /**
     * Validate paymaster data format
     */
    validatePaymasterData(paymasterAndData) {
        try {
            if (paymasterAndData.length < 84 * 2 + 2) { // 84 bytes = 168 hex chars + "0x"
                return {isValid: false, error: "Paymaster data too short"};
            }

            const paymaster = paymasterAndData.slice(0, 42); // 20 bytes = 40 hex + "0x"
            const validUntil = parseInt(paymasterAndData.slice(42, 54), 16); // 6 bytes
            const validAfter = parseInt(paymasterAndData.slice(54, 66), 16); // 6 bytes
            const signature = "0x" + paymasterAndData.slice(66);

            return {
                isValid: true,
                parsed: {
                    paymaster,
                    validUntil,
                    validAfter,
                    signature
                }
            };
        } catch (error) {
            return {
                isValid: false,
                error: `Invalid paymaster data format: ${error}`
            };
        }
    }
}

module.exports = {
    PaymasterService
};
