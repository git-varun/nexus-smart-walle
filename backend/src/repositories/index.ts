// Repository exports
export {BaseRepository} from './BaseRepository';
export type {Repository} from './BaseRepository';

import {UserRepository} from './UserRepository';
import {AccountRepository} from './AccountRepository';
import {TransactionRepository} from './TransactionRepository';
import {SessionRepository} from './SessionRepository';

export {UserRepository, AccountRepository, TransactionRepository, SessionRepository};

// Repository instances (singletons)
export const userRepository = new UserRepository();
export const accountRepository = new AccountRepository();
export const transactionRepository = new TransactionRepository();
export const sessionRepository = new SessionRepository();

// Repository health check
export async function checkRepositoryHealth(): Promise<{
    healthy: boolean;
    repositories: Record<string, boolean>;
}> {
    const results = {
        user: await userRepository.healthCheck(),
        account: await accountRepository.healthCheck(),
        transaction: await transactionRepository.healthCheck(),
        session: await sessionRepository.healthCheck()
    };

    const healthy = Object.values(results).every(Boolean);

    return {
        healthy,
        repositories: results
    };
}

// Get all repository stats
export async function getAllRepositoryStats() {
    const [userStats, accountStats, transactionStats, sessionStats] = await Promise.all([
        userRepository.getStats(),
        accountRepository.getStats(),
        transactionRepository.getStats(),
        sessionRepository.getStats()
    ]);

    return {
        users: userStats,
        accounts: accountStats,
        transactions: transactionStats,
        sessions: sessionStats
    };
}

// Cleanup expired sessions periodically
export function startSessionCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
    return setInterval(async () => {
        try {
            const cleaned = await sessionRepository.cleanupExpiredSessions();
            if (cleaned > 0) {
                console.log(`Cleaned up ${cleaned} expired sessions`);
            }
        } catch (error) {
            console.error('Error during session cleanup:', error);
        }
    }, intervalMs);
}
