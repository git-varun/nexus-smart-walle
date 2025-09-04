import {CreateTransactionInput, Transaction, UpdateTransactionInput} from '../types';
import {TransactionDocument, TransactionModel} from '../models';

function transformDocument(doc: TransactionDocument): Transaction {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        smartAccountId: doc.smartAccountId,
        hash: doc.hash,
        userOpHash: doc.userOpHash || undefined,
        to: doc.to,
        value: doc.value || undefined,
        data: doc.data || undefined,
        status: doc.status,
        chainId: doc.chainId,
        gasUsed: doc.gasUsed || undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function transformCreateInput(data: CreateTransactionInput): Partial<TransactionDocument> {
    return {
        userId: data.userId,
        smartAccountId: data.smartAccountId,
        hash: data.hash,
        userOpHash: data.userOpHash,
        to: data.to.toLowerCase(),
        value: data.value,
        data: data.data,
        status: data.status,
        chainId: data.chainId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

function transformUpdateInput(data: UpdateTransactionInput) {
    const updateData: any = {updatedAt: new Date()};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.gasUsed !== undefined) updateData.gasUsed = data.gasUsed;
    return updateData;
}

export async function create(data: CreateTransactionInput): Promise<Transaction> {
    const createData = transformCreateInput(data);
    const doc = new TransactionModel(createData);
    const savedDoc = await doc.save();
    return transformDocument(savedDoc);
}

export async function findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id);
    return doc ? transformDocument(doc) : null;
}

export async function update(id: string, data: UpdateTransactionInput): Promise<Transaction | null> {
    const updateData = transformUpdateInput(data);
    const doc = await TransactionModel.findByIdAndUpdate(
        id,
        updateData,
        {new: true, runValidators: true}
    );

    return doc ? transformDocument(doc) : null;
}

export async function remove(id: string): Promise<boolean> {
    const result = await TransactionModel.findByIdAndDelete(id);
    return !!result;
}

export async function findByHash(hash: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findOne({hash});
    return doc ? transformDocument(doc) : null;
}

export async function findByUserId(userId: string, chainId?: number): Promise<Transaction[]> {
    const query: any = {userId};
    if (chainId !== undefined) {
        query.chainId = Number(chainId);
    }

    const docs = await TransactionModel.find(query)
        .sort({createdAt: -1})
        .exec();

    return docs.map(transformDocument);
}

export async function findUserOpByHash(userOpHash: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findOne({userOpHash: userOpHash})
        .sort({createdAt: -1})
        .exec();
    return doc ? transformDocument(doc) : null;
}

export async function findUserOpByHashAndUpdate(userOpHash: string, hash: string, gasUsed: number): Promise<Transaction | null> {
    const doc = await TransactionModel.findOneAndUpdate({userOpHash: userOpHash}, {
        $set: {
            hash: hash,
            gasUsed: gasUsed,
            status: "confirmed"
        }, "updatedAt": new Date()
    })
        .sort({createdAt: -1})
        .exec();
    return doc ? transformDocument(doc) : null;
}
