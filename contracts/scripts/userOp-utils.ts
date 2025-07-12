// contracts/scripts/userOp-utils.ts
import {ethers} from "ethers";

/**
 * UserOperation utilities for ERC-4337 integration
 */

export interface UserOperationStruct {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: Uint8Array;
    signature: string;
}

export interface PaymasterData {
    paymaster: string;
    validUntil: number;
    validAfter: number;
    signature: string;
}

/**
 * Calculate UserOperation hash
 */
export function getUserOpHash(
    userOp: UserOperationStruct,
    entryPointAddress: string,
    chainId: number
): string {
    const encoded = ethers.utils.defaultAbiCoder().encode(
        [
            "address", // sender
            "uint256", // nonce
            "bytes32", // initCode hash
            "bytes32", // callData hash
            "uint256", // callGasLimit
            "uint256", // verificationGasLimit
            "uint256", // preVerificationGas
            "uint256", // maxFeePerGas
            "uint256", // maxPriorityFeePerGas
            "bytes32", // paymasterAndData hash
        ],
        [
            userOp.sender,
            userOp.nonce,
            ethers.utils.keccak256(userOp.initCode),
            ethers.utils.keccak256(userOp.callData),
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            ethers.utils.keccak256(userOp.paymasterAndData),
        ]
    );

    const userOpHash = ethers.utils.keccak256(encoded);

    return ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder().encode(
            ["bytes32", "address", "uint256"],
            [userOpHash, entryPointAddress, chainId]
        )
    );
}

/**
 * Pack paymaster data for VerifyingPaymaster
 */
export function packPaymasterData(
    paymasterAddress: string,
    validUntil: number,
    validAfter: number,
    signature: string
): Uint8Array {
    const validUntilBytes = ethers.utils.zeroPad(ethers.utils.hexlify(validUntil), 6);
    const validAfterBytes = ethers.utils.zeroPad(ethers.utils.hexlify(validAfter), 6);

    return ethers.utils.concat([
        paymasterAddress,
        validUntilBytes,
        validAfterBytes,
        signature
    ]);
}

/**
 * Create initCode for account creation
 */
export function createInitCode(
    factoryAddress: string,
    owner: string,
    salt: number
): Uint8Array {
    const factoryInterface = new ethers.utils.Interface([
        "function createAccount(address owner, uint256 salt) returns (address)"
    ]);

    const createAccountCall = factoryInterface.encodeFunctionData("createAccount", [
        owner,
        salt
    ]);

    return ethers.utils.concat([factoryAddress, createAccountCall]);
}

/**
 * Estimate gas for UserOperation
 */
export async function estimateUserOpGas(
    provider: ethers.providers.Provider,
    userOp: Partial<UserOperationStruct>
): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
}> {
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
            baseGas.callGasLimit = (gasEstimate.add(BigInt(10000))).toString(); // Add buffer
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
export async function getGasPrices(provider: ethers.providers.Provider): Promise<{
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
}> {
    try {
        const feeData = await provider.getFeeData();

        return {
            maxFeePerGas: (feeData.maxFeePerGas || ethers.utils.parseUnits("20", "gwei")).toString(),
            maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas || ethers.utils.parseUnits("2", "gwei")).toString(),
        };
    } catch (error) {
        console.warn("Didn't get gas prices, using defaults:", error);
        return {
            maxFeePerGas: ethers.utils.parseUnits("20", "gwei").toString(),
            maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei").toString(),
        };
    }
}

/**
 * Sign UserOperation hash
 */
export async function signUserOp(
    userOpHash: string,
    signer: ethers.Signer
): Promise<string> {
    return await signer.signMessage(ethers.utils.getBytes(userOpHash));
}

/**
 * Build complete UserOperation
 */
export async function buildUserOperation(
    params: {
        sender: string;
        nonce: string;
        initCode?: string;
        callData: string;
        paymasterData?: PaymasterData;
    },
    provider: ethers.providers.Provider,
    signer: ethers.Signer,
    entryPointAddress: string,
    chainId: number
): Promise<UserOperationStruct> {

    // Estimate gas
    const gasEstimates = await estimateUserOpGas(provider, {
        sender: params.sender,
        callData: params.callData,
        initCode: params.initCode || "0x",
    });

    // Get gas prices
    const gasPrices = await getGasPrices(provider);

    // Build base UserOp
    const userOp: UserOperationStruct = {
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
