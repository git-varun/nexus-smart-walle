import {IUser, UserModel} from '../models';

export async function createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(data);
    return await user.save();
}

export async function findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
}

export async function findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({email});
}

export async function findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({username});
}

export async function updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, {new: true});
}

export async function updateLastLogin(userId: string): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
        {userId},
        {$set: {lastLogin: new Date()}},
        {new: true}
    );
}

export async function deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
}

export async function findAll(): Promise<IUser[]> {
    return UserModel.find();
}

export async function countUsers(): Promise<number> {
    return UserModel.countDocuments();
}

