import {BaseRepository} from './BaseRepository';
import {CreateSessionInput, isSessionExpired, isSessionValid, Session} from '../models';

// In-memory storage for sessions
const sessionStorage = new Map<string, Session>();

export class SessionRepository extends BaseRepository<Session, CreateSessionInput, never> {

    // Sessions don't support updates (they're immutable)
    async update(): Promise<Session | null> {
        throw new Error('Sessions cannot be updated. Create a new session instead.');
    }

    // Session-specific methods
    async findByToken(token: string): Promise<Session | null> {
        const session = await this.findOneBy('token', token);

        // Return null if session is expired or invalid
        if (session && (isSessionExpired(session) || !isSessionValid(session))) {
            await this.delete(session.id); // Clean up expired session
            return null;
        }

        return session;
    }

    async findValidByToken(token: string): Promise<Session | null> {
        const session = await this.findByToken(token);
        return session && isSessionValid(session) ? session : null;
    }

    async findByUserId(userId: string): Promise<Session[]> {
        const sessions = await this.findBy('userId', userId);
        // Filter out expired sessions and clean them up
        const validSessions: Session[] = [];

        for (const session of sessions) {
            if (isSessionExpired(session)) {
                await this.delete(session.id);
            } else {
                validSessions.push(session);
            }
        }

        return validSessions;
    }

    async revokeUserSessions(userId: string): Promise<number> {
        const userSessions = await this.findBy('userId', userId);
        let revokedCount = 0;

        for (const session of userSessions) {
            if (await this.delete(session.id)) {
                revokedCount++;
            }
        }

        return revokedCount;
    }

    async revokeSession(token: string): Promise<boolean> {
        const session = await this.findOneBy('token', token);
        if (!session) {
            return false;
        }

        return this.delete(session.id);
    }

    // Clean up expired sessions
    async cleanupExpiredSessions(): Promise<number> {
        const allSessions = Array.from(this.getStorage().values());
        let cleanedCount = 0;

        for (const session of allSessions) {
            if (isSessionExpired(session)) {
                if (await this.delete(session.id)) {
                    cleanedCount++;
                }
            }
        }

        return cleanedCount;
    }

    async getExpiredSessions(): Promise<Session[]> {
        const allSessions = Array.from(this.getStorage().values());
        return allSessions.filter(session => isSessionExpired(session));
    }

    async getActiveSessions(): Promise<Session[]> {
        const allSessions = Array.from(this.getStorage().values());
        return allSessions.filter(session => !isSessionExpired(session));
    }

    // Extend session expiry
    async extendSession(token: string, newExpiryDate: Date): Promise<Session | null> {
        const session = await this.findByToken(token);
        if (!session) {
            return null;
        }

        // Create a new session with extended expiry (since sessions are immutable)
        await this.delete(session.id);
        return this.create({
            userId: session.userId,
            token: session.token,
            expiresAt: newExpiryDate
        });
    }

    // Statistics
    async getStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        expiredSessions: number;
        sessionsByUser: Record<string, number>;
        averageSessionDuration: number; // in hours
        sessionsLast24h: number;
    }> {
        const allSessions = Array.from(this.getStorage().values());
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const sessionsByUser: Record<string, number> = {};
        let totalDuration = 0;
        let durationCount = 0;

        for (const session of allSessions) {
            // Count by user
            sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1;

            // Calculate duration for completed/expired sessions
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
            totalSessions: allSessions.length,
            activeSessions: allSessions.filter(s => !isSessionExpired(s)).length,
            expiredSessions: allSessions.filter(s => isSessionExpired(s)).length,
            sessionsByUser,
            averageSessionDuration: Math.round(averageSessionDuration * 100) / 100, // Round to 2 decimals
            sessionsLast24h: allSessions.filter(s => s.createdAt > yesterday).length
        };
    }

    protected getStorage(): Map<string, Session> {
        return sessionStorage;
    }

    protected createEntity(id: string, data: CreateSessionInput): Session {
        return {
            id,
            userId: data.userId,
            token: data.token,
            expiresAt: data.expiresAt,
            createdAt: new Date()
        };
    }
}
