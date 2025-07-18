// contracts/scripts/userOp-utils.js
const {hashUserOperationV0_6} = require("@aa-sdk/core");
const hre = require("hardhat");

const {ethers} = hre;

/**
 * UserOperation utilities for ERC-4337 integration
 */

/**
 * Calculate UserOperation hash using new SDK method
 */
function getUserOpHash(userOp, entryPointAddress, chainId) {
    // Use the new SDK method for hash calculation
    return hashUserOperationV0_6({
        sender: userOp.sender,
        nonce: BigInt(userOp.nonce),
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: BigInt(userOp.callGasLimit),
        verificationGasLimit: BigInt(userOp.verificationGasLimit),
        preVerificationGas: BigInt(userOp.preVerificationGas),
        maxFeePerGas: BigInt(userOp.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(userOp.maxPriorityFeePerGas),
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
    }, entryPointAddress, BigInt(chainId));
}

/**
 * Pack paymaster data for VerifyingPaymaster
 */
function packPaymasterData(paymasterAddress, validUntil, validAfter, signature) {
    const validUntilBytes = ethers.zeroPadValue(ethers.toBeHex(validUntil), 6);
    const validAfterBytes = ethers.zeroPadValue(ethers.toBeHex(validAfter), 6);

    return ethers.concat([
        paymasterAddress,
        validUntilBytes,
        validAfterBytes,
        signature
    ]);
}

/**
 * Create initCode for account creation
 */
function createInitCode(factoryAddress, owner, salt) {
    const factoryInterface = new ethers.Interface([
        "function createAccount(address owner, uint256 salt) returns (address)"
    ]);

    const createAccountCall = factoryInterface.encodeFunctionData("createAccount", [
        owner,
        salt
    ]);

    return ethers.concat([factoryAddress, createAccountCall]);
}

/**
 * Estimate gas for UserOperation
 */
async function estimateUserOpGas(provider, userOp) {
    // Default gas estimates
    const baseGas = {
        callGasLimit: "100000",
        verificationGasLimit: "150000",
        preVerificationGas: "21000",
    };

    try {
        // Estimate call gas limit if we have callData
        if (userOp.callData && userOp.callData !== "0x" && userOp.sender) {
            const gasEstimate = await provider.estimateGas({
                to: userOp.sender,
                data: userOp.callData,
            });
            baseGas.callGasLimit = (gasEstimate + BigInt(10000)).toString(); // Add buffer
        }

        // Adjust verification gas based on initCode
        if (userOp.initCode && userOp.initCode !== "0x") {
            baseGas.verificationGasLimit = "500000"; // Higher for account creation
        }

    } catch (error) {
        console.warn("Gas estimation failed, using defaults:", error);
    }

    return baseGas;
}

/**
 * Get current gas prices
 */
async function getGasPrices(provider) {
    try {
        const feeData = await provider.getFeeData();

        return {
            maxFeePerGas: (feeData.maxFeePerGas || ethers.parseUnits("20", "gwei")).toString(),
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei")).toString(),
        };
    } catch (error) {
        console.warn("Didn't get gas prices, using defaults:", error);
        return {
            maxFeePerGas: ethers.parseUnits("20", "gwei").toString(),
            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei").toString(),
        };
    }
}

/**
 * Sign UserOperation hash
 */
async function signUserOp(userOpHash, signer) {
    return await signer.signMessage(ethers.getBytes(userOpHash));
}

/**
 * Build complete UserOperation
 */
async function buildUserOperation(params, provider, signer, entryPointAddress, chainId) {
    // Estimate gas
    const gasEstimates = await estimateUserOpGas(provider, {
        sender: params.sender,
        callData: params.callData,
        initCode: params.initCode || "0x",
    });

    // Get gas prices
    const gasPrices = await getGasPrices(provider);

    // Build base UserOp
    const userOp = {
        sender: params.sender,
        nonce: params.nonce,
        initCode: params.initCode || "0x",
        callData: params.callData,
        callGasLimit: gasEstimates.callGasLimit,
        verificationGasLimit: gasEstimates.verificationGasLimit,
        preVerificationGas: gasEstimates.preVerificationGas,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        paymasterAndData: "0x",
        signature: "0x",
    };

    // Add paymaster data if provided
    if (params.paymasterData) {
        userOp.paymasterAndData = packPaymasterData(
            params.paymasterData.paymaster,
            params.paymasterData.validUntil,
            params.paymasterData.validAfter,
            params.paymasterData.signature
        );
    }

    // Calculate hash and sign
    const userOpHash = getUserOpHash(userOp, entryPointAddress, chainId);
    userOp.signature = await signUserOp(userOpHash, signer);

    return userOp;
}

module.exports = {
    getUserOpHash,
    packPaymasterData,
    createInitCode,
    estimateUserOpGas,
    getGasPrices,
    signUserOp,
    buildUserOperation
};
