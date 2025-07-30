export interface UserOperationStage {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    timestamp?: number;
    details?: string;
    txHash?: string;
    gasUsed?: string;
}

export interface UserOperationLifecycle {
    userOpHash: string;
    overallStatus: 'pending' | 'success' | 'failed';
    createdAt: number;
    finalTxHash?: string;
    finalBlockNumber?: string;
    error?: string;
    estimatedGas?: string;
    actualGasUsed?: string;
    stages: UserOperationStage[];
}
