import {FilterQuery} from 'mongoose';
import {CreateUserInput, UpdateUserInput, User} from '../types';
import {UserDocument, UserModel} from '../database';

// Transform functions
function transformDocument(doc: UserDocument): User {
    return {
        id: doc._id.toString(),
        email: doc.email,
        password: doc.password,
        lastLogin: doc.lastLogin || undefined,
        createdAt: doc.createdAt
    };
}

function transformCreateInput(data: CreateUserInput): Partial<UserDocument> {
    return {
        email: data.email,
        password: data.password,
        createdAt: new Date()
    };
}

function transformUpdateInput(data: UpdateUserInput) {
    const updateData: any = {};
    if (data.lastLogin !== undefined) updateData.lastLogin = data.lastLogin;
    if (data.password !== undefined) updateData.password = data.password;
    return updateData;
}

// Core CRUD functions
export async function create(data: CreateUserInput): Promise<User> {
    const createData = transformCreateInput(data);
    const doc = new UserModel(createData);
    const savedDoc = await doc.save();
    return transformDocument(savedDoc);
}

export async function findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? transformDocument(doc) : null;
}

export async function findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const docs = await UserModel.find({})
        .skip(offset)
        .limit(limit)
        .exec();

    return docs.map(transformDocument);
}

export async function update(id: string, data: UpdateUserInput): Promise<User | null> {
    const updateData = transformUpdateInput(data);
    const doc = await UserModel.findByIdAndUpdate(
        id,
        updateData,
        {new: true, runValidators: true}
    );

    return doc ? transformDocument(doc) : null;
}

export async function remove(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
}

export async function count(): Promise<number> {
    return UserModel.countDocuments({});
}

// Query functions
export async function findByQuery(query: FilterQuery<UserDocument>, options?: {
    limit?: number;
    sort?: any
}): Promise<User[]> {
    let queryBuilder = UserModel.find(query);

    if (options?.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
    }

    if (options?.sort) {
        queryBuilder = queryBuilder.sort(options.sort);
    }

    const docs = await queryBuilder.exec();
    return docs.map(transformDocument);
}

export async function countByQuery(query: FilterQuery<UserDocument>): Promise<number> {
    return UserModel.countDocuments(query);
}

export async function findOneBy(field: keyof User, value: any): Promise<User | null> {
    const query = {[field as string]: value} as FilterQuery<UserDocument>;
    const doc = await UserModel.findOne(query);
    return doc ? transformDocument(doc) : null;
}

// User-specific functions
export async function findByEmail(email: string): Promise<User | null> {
    return findOneBy('email', email);
}

export async function findByEmailWithPassword(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({email}).select('+password');
    return doc ? transformDocument(doc) : null;
}

export async function updateLastLogin(id: string): Promise<User | null> {
    return update(id, {password: undefined, lastLogin: new Date()});
}

export async function findRecentUsers(limit: number = 10): Promise<User[]> {
    return findByQuery(
        {},
        {
            limit,
            sort: {lastLogin: -1, createdAt: -1}
        }
    );
}

// Statistics
export async function getStats(): Promise<{
    totalUsers: number;
    usersWithLastLogin: number;
    recentlyActiveUsers: number; // last 24 hours
}> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalUsers, usersWithLastLogin, recentlyActiveUsers] = await Promise.all([
        count(),
        countByQuery({lastLogin: {$ne: null}}),
        countByQuery({lastLogin: {$gt: yesterday}})
    ]);

    return {
        totalUsers,
        usersWithLastLogin,
        recentlyActiveUsers
    };
}

// Health check
export async function healthCheck(): Promise<boolean> {
    try {
        await UserModel.findOne({}).limit(1);
        return true;
    } catch {
        return false;
    }
}

// Backward compatibility exports
export {remove as delete};
export const deleteUser = remove;
