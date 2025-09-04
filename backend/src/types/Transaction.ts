// Transaction domain types
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
    id: string;
    userId: string;
    smartAccountId: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
    gasUsed?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTransactionInput {
    userId: string;
    smartAccountId: string;
    hash: string;
    userOpHash?: string;
    to: string;
    value?: string;
    data?: string;
    status: TransactionStatus;
}

export interface UpdateTransactionInput {
    status?: TransactionStatus;
    gasUsed?: string;
}