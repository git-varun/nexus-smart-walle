import {ITransaction, TransactionModel, TransactionStatus} from '../models';

export async function createTransaction(data: {
    userId: string;
    accountId: string;
    hash: string;
    userOpHash: string;
    status?: TransactionStatus;
    chainId: number
}): Promise<ITransaction> {
    const transaction = new TransactionModel(data);
    return await transaction.save();
}

export async function findTransactionById(id: string): Promise<ITransaction | null> {
    return TransactionModel.findById(id);
}

export async function findTransactionByHash(hash: string): Promise<ITransaction | null> {
    return TransactionModel.findOne({hash});
}

export async function findTransactionsByUserId(userId: string): Promise<ITransaction[]> {
    return TransactionModel.find({userId}).sort({createdAt: -1});
}

export async function findTransactionsByAccountId(accountId: string): Promise<ITransaction[]> {
    return TransactionModel.find({accountId}).sort({createdAt: -1});
}

export async function updateTransaction(id: string, data: any): Promise<ITransaction | null> {
    return TransactionModel.findByIdAndUpdate(id, data, {new: true});
}

export async function deleteTransaction(id: string): Promise<boolean> {
    const result = await TransactionModel.findByIdAndDelete(id);
    return !!result;
}

export async function findAllTransactions(): Promise<ITransaction[]> {
    return TransactionModel.find({}).sort({createdAt: -1});
}
