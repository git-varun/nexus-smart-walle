import {AccountModel, IAccount} from '../models/Account.schema';

export async function createAccount(data: {
    userId: string;
    address: string;
    chainId: number;
    isDeployed?: boolean;
    balance?: string;
    nonce?: number;
    signerAddress?: string;
    alchemyAccountId?: string;
    requestId?: string;
    salt?: string;
    accountType?: string;
    factoryAddress?: string;
    factoryData?: string
    isActive?: boolean;
}): Promise<IAccount> {
    const account = new AccountModel(data);
    return await account.save();
}

export async function findAccountById(id: string): Promise<IAccount | null> {
    return AccountModel.findById(id);
}

export async function findAccountByAddress(address: string): Promise<IAccount | null> {
    return AccountModel.findOne({address: address.toLowerCase()});
}

export async function findAccountsByUserId(userId: string): Promise<IAccount[]> {
    return AccountModel.find({userId});
}

export async function updateAccount(id: string, data: any): Promise<IAccount | null> {
    return AccountModel.findByIdAndUpdate(id, data, {new: true});
}

export async function findBy(query: { userId: string, chainId: number }): Promise<IAccount[]> {
    return AccountModel.find(query);
}

export async function deleteAccount(id: string): Promise<boolean> {
    const result = await AccountModel.findByIdAndDelete(id);
    return !!result;
}

export async function findAllAccounts(): Promise<IAccount[]> {
    return AccountModel.find({});
}
