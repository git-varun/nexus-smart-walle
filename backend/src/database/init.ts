import {connectDB, disconnectDB, isDBConnected} from './connection';
import {config} from '../config';

export async function initializeDatabase(): Promise<void> {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB(config.database.mongodb.uri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Failed to connect to database:', error);
        throw error;
    }
}

export async function closeDatabase(): Promise<void> {
    try {
        await disconnectDB();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting from database:', error);
        throw error;
    }
}

export function getDatabaseStatus(): boolean {
    return isDBConnected();
}
