import {Address, Hash, Hex} from "viem";

export interface AlchemyConfig {
    apiKey: string;
    policyId?: string;
    chainId?: number;
}

export interface SmartAccount {
    id?: string;
    userId?: string;
    address: Address;
    chainId?: number;
    isDeployed: boolean;
    nonce: bigint | number;
    balance?: bigint;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Transaction {
    to: Address;
    data?: Hex;
    value?: bigint;
    version?: '0.6' | '0.7';
}

export interface TransactionResult {
    hash: Hash;
    userOpHash?: Hash;
    success: boolean;
}

export interface User {
    id?: string;
    email?: string;
    userId?: string;
    createdAt?: Date;
}

export interface UserOperation {
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

export interface AlchemyServiceInstance {
    publicClient: any;
    bundlerUrl: string;
    paymasterUrl: string;
    currentUser: User | null;
    smartAccountAddress: Address | null;
}
