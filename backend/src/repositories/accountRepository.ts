import {CreateSmartAccountInput, SmartAccount, UpdateSmartAccountInput} from '../types';
import {SmartAccountDocument, SmartAccountModel} from '../models';

function transformDocument(doc: SmartAccountDocument): SmartAccount {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        address: doc.address,
        chainId: doc.chainId,
        isDeployed: doc.isDeployed,
        balance: doc.balance || undefined,
        nonce: doc.nonce || undefined,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function transformCreateInput(data: CreateSmartAccountInput): Partial<SmartAccountDocument> {
    return {
        userId: data.userId,
        address: data.address.toLowerCase(),
        chainId: data.chainId,
        isDeployed: data.isDeployed,
        balance: data.balance,
        nonce: data.nonce,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

function transformUpdateInput(data: UpdateSmartAccountInput) {
    const updateData: any = {updatedAt: new Date()};
    if (data.isDeployed !== undefined) updateData.isDeployed = data.isDeployed;
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.nonce !== undefined) updateData.nonce = data.nonce;
    return updateData;
}

export async function create(data: CreateSmartAccountInput): Promise<SmartAccount> {
    const createData = transformCreateInput(data);
    const doc = new SmartAccountModel(createData);
    const savedDoc = await doc.save();
    return transformDocument(savedDoc);
}

export async function findById(id: string): Promise<SmartAccount | null> {
    const doc = await SmartAccountModel.findById(id);
    return doc ? transformDocument(doc) : null;
}

export async function update(id: string, data: UpdateSmartAccountInput): Promise<SmartAccount | null> {
    const updateData = transformUpdateInput(data);
    const doc = await SmartAccountModel.findByIdAndUpdate(
        id,
        updateData,
        {new: true, runValidators: true}
    );

    return doc ? transformDocument(doc) : null;
}

export async function remove(id: string): Promise<boolean> {
    const result = await SmartAccountModel.findByIdAndDelete(id);
    return !!result;
}

export async function findByAddress(address: string): Promise<SmartAccount | null> {
    const doc = await SmartAccountModel.findOne({address: address.toLowerCase()});
    return doc ? transformDocument(doc) : null;
}

export async function findByUserId(userId: string): Promise<SmartAccount[]> {
    const docs = await SmartAccountModel.find({userId});
    return docs.map(transformDocument);
}
