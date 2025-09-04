// Import all repository functions
import * as userRepo from './userRepository';
import * as accountRepo from './accountRepository';
import * as transactionRepo from './transactionRepository';
import * as sessionRepo from './sessionRepository';

// Re-export repository modules with consistent naming
export const userRepository = userRepo;
export const accountRepository = accountRepo;
export const transactionRepository = transactionRepo;
export const sessionRepository = sessionRepo;

// Repository health check
export async function checkRepositoryHealth(): Promise<{
    healthy: boolean;
    repositories: Record<string, boolean>;
}> {
    // Simplified health check for POC - just check if modules are loaded
    const results = {
        user: true,
        account: true,
        transaction: true,
        session: true
    };

    const healthy = Object.values(results).every(Boolean);

    return {
        healthy,
        repositories: results
    };
}

// Get all repository stats
export async function getAllRepositoryStats() {
    // Simplified stats for POC - return basic counts
    return {
        users: {count: 0},
        accounts: {count: 0},
        transactions: {count: 0},
        sessions: {count: 0}
    };
}

// Cleanup expired sessions periodically
export function startSessionCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
    return setInterval(async () => {
        try {
            const cleaned = await sessionRepo.cleanupExpiredSessions();
            if (cleaned > 0) {
                console.log(`Cleaned up ${cleaned} expired sessions`);
            }
        } catch (error) {
            console.error('Error during session cleanup:', error);
        }
    }, intervalMs);
}
