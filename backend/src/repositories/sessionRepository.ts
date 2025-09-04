import {FilterQuery} from 'mongoose';
import {CreateSessionInput, Session} from '../types';
import {SessionDocument, SessionModel} from '../models';
import {isSessionExpired, isSessionValid} from '../utils';

// Transform functions
function transformDocument(doc: SessionDocument): Session {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        token: doc.token,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt
    };
}

function transformCreateInput(data: CreateSessionInput): Partial<SessionDocument> {
    return {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: new Date()
    };
}

// Core CRUD functions
export async function create(data: CreateSessionInput): Promise<Session> {
    const createData = transformCreateInput(data);
    const doc = new SessionModel(createData);
    const savedDoc = await doc.save();
    return transformDocument(savedDoc);
}

export async function findById(id: string): Promise<Session | null> {
    const doc = await SessionModel.findById(id);
    return doc ? transformDocument(doc) : null;
}

export async function findAll(limit: number = 100, offset: number = 0): Promise<Session[]> {
    const docs = await SessionModel.find({})
        .skip(offset)
        .limit(limit)
        .exec();

    return docs.map(transformDocument);
}

// Sessions don't support updates (they're immutable)
export async function update(): Promise<Session | null> {
    throw new Error('Sessions cannot be updated. Create a new session instead.');
}

export async function remove(id: string): Promise<boolean> {
    const result = await SessionModel.findByIdAndDelete(id);
    return !!result;
}

export async function count(): Promise<number> {
    return SessionModel.countDocuments({});
}

// Query functions
export async function findByQuery(query: FilterQuery<SessionDocument>, options?: {
    limit?: number;
    sort?: any
}): Promise<Session[]> {
    let queryBuilder = SessionModel.find(query);

    if (options?.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
    }

    if (options?.sort) {
        queryBuilder = queryBuilder.sort(options.sort);
    }

    const docs = await queryBuilder.exec();
    return docs.map(transformDocument);
}

export async function countByQuery(query: FilterQuery<SessionDocument>): Promise<number> {
    return SessionModel.countDocuments(query);
}

export async function findOneBy(field: keyof Session, value: any): Promise<Session | null> {
    const query = {[field as string]: value} as FilterQuery<SessionDocument>;
    const doc = await SessionModel.findOne(query);
    return doc ? transformDocument(doc) : null;
}

export async function findBy(field: keyof Session, value: any, limit?: number): Promise<Session[]> {
    const query = {[field as string]: value} as FilterQuery<SessionDocument>;
    const queryBuilder = SessionModel.find(query);

    if (limit) {
        queryBuilder.limit(limit);
    }

    const docs = await queryBuilder.exec();
    return docs.map(transformDocument);
}

// Session-specific functions
export async function findByToken(token: string): Promise<Session | null> {
    const session = await findOneBy('token', token);

    // Return null if session is expired or invalid
    if (session && (isSessionExpired(session) || !isSessionValid(session))) {
        await remove(session.id); // Clean up expired session
        return null;
    }

    return session;
}

export async function findValidByToken(token: string): Promise<Session | null> {
    const session = await findByToken(token);
    return session && isSessionValid(session) ? session : null;
}

export async function findByUserId(userId: string): Promise<Session[]> {
    const sessions = await findBy('userId', userId);
    // Filter out expired sessions and clean them up
    const validSessions: Session[] = [];

    for (const session of sessions) {
        if (isSessionExpired(session)) {
            await remove(session.id);
        } else {
            validSessions.push(session);
        }
    }

    return validSessions;
}

export async function revokeUserSessions(userId: string): Promise<number> {
    const userSessions = await findBy('userId', userId);
    let revokedCount = 0;

    for (const session of userSessions) {
        if (await remove(session.id)) {
            revokedCount++;
        }
    }

    return revokedCount;
}

export async function revokeSession(token: string): Promise<boolean> {
    const session = await findOneBy('token', token);
    if (!session) {
        return false;
    }

    return remove(session.id);
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
    const now = new Date();

    // MongoDB TTL index should handle this automatically, but we can also do manual cleanup
    const expiredSessions = await findByQuery({expiresAt: {$lt: now}});

    let cleanedCount = 0;
    for (const session of expiredSessions) {
        if (await remove(session.id)) {
            cleanedCount++;
        }
    }

    return cleanedCount;
}

export async function getExpiredSessions(): Promise<Session[]> {
    const now = new Date();
    return findByQuery({expiresAt: {$lt: now}});
}

export async function getActiveSessions(): Promise<Session[]> {
    const now = new Date();
    return findByQuery({expiresAt: {$gt: now}});
}

// Extend session expiry
export async function extendSession(token: string, newExpiryDate: Date): Promise<Session | null> {
    const session = await findByToken(token);
    if (!session) {
        return null;
    }

    // Create a new session with extended expiry (since sessions are immutable)
    await remove(session.id);
    return create({
        userId: session.userId,
        token: session.token,
        expiresAt: newExpiryDate
    });
}

// Statistics
export async function getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    sessionsByUser: Record<string, number>;
    averageSessionDuration: number; // in hours
    sessionsLast24h: number;
}> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
        totalSessions,
        activeSessions,
        expiredSessions,
        sessionsLast24h,
        allSessions
    ] = await Promise.all([
        count(),
        countByQuery({expiresAt: {$gt: now}}),
        countByQuery({expiresAt: {$lt: now}}),
        countByQuery({createdAt: {$gt: yesterday}}),
        findAll()
    ]);

    // Calculate sessions by user and average duration
    const sessionsByUser: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    for (const session of allSessions) {
        // Count by user
        sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1;

        // Calculate duration for expired sessions
        if (isSessionExpired(session)) {
            const duration = session.expiresAt.getTime() - session.createdAt.getTime();
            totalDuration += duration;
            durationCount++;
        }
    }

    const averageSessionDuration = durationCount > 0
        ? totalDuration / durationCount / (1000 * 60 * 60) // Convert to hours
        : 0;

    return {
        totalSessions,
        activeSessions,
        expiredSessions,
        sessionsByUser,
        averageSessionDuration: Math.round(averageSessionDuration * 100) / 100, // Round to 2 decimals
        sessionsLast24h
    };
}

// Health check
export async function healthCheck(): Promise<boolean> {
    try {
        await SessionModel.findOne({}).limit(1);
        return true;
    } catch {
        return false;
    }
}

// Backward compatibility exports
export {remove as delete};
export const deleteSession = remove;
