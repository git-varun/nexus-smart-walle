// frontend/src/types/account.ts
export interface SmartAccountInfo {
    address: string
    owner: string
    nonce: number
    isDeployed: boolean
    balance: string
    modules: string[]
}

export interface UserOperation {
    sender: string
    nonce: string
    initCode: string
    callData: string
    callGasLimit: string
    verificationGasLimit: string
    preVerificationGas: string
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    paymasterAndData: string
    signature: string
}

export interface UserOperationReceipt {
    userOpHash: string
    entryPoint: string
    sender: string
    nonce: string
    paymaster?: string
    actualGasCost: string
    actualGasUsed: string
    success: boolean
    logs: any[]
    receipt: any
}
