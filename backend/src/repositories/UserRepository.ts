import {BaseRepository} from './BaseRepository';
import {CreateUserInput, UpdateUserInput, User} from '../models';

// In-memory storage for users
const userStorage = new Map<string, User>();

export class UserRepository extends BaseRepository<User, CreateUserInput, UpdateUserInput> {

    // User-specific methods
    async findByEmail(email: string): Promise<User | null> {
        return this.findOneBy('email', email);
    }

    async updateLastLogin(id: string): Promise<User | null> {
        return this.update(id, {lastLogin: new Date()});
    }

    async findRecentUsers(limit: number = 10): Promise<User[]> {
        const allUsers = Array.from(this.getStorage().values());
        return allUsers
            .sort((a, b) => (b.lastLogin || b.createdAt).getTime() - (a.lastLogin || a.createdAt).getTime())
            .slice(0, limit);
    }

    // Statistics
    async getStats(): Promise<{
        totalUsers: number;
        usersWithLastLogin: number;
        recentlyActiveUsers: number; // last 24 hours
    }> {
        const allUsers = Array.from(this.getStorage().values());
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return {
            totalUsers: allUsers.length,
            usersWithLastLogin: allUsers.filter(user => user.lastLogin).length,
            recentlyActiveUsers: allUsers.filter(user =>
                user.lastLogin && user.lastLogin > yesterday
            ).length
        };
    }

    protected getStorage(): Map<string, User> {
        return userStorage;
    }

    protected createEntity(id: string, data: CreateUserInput): User {
        return {
            id,
            email: data.email,
            createdAt: new Date()
        };
    }
}
