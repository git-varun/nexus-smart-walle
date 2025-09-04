import {dbConnection} from './connection';
import {config} from '../config';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('DatabaseInit');

export async function initializeDatabase(): Promise<void> {
    try {
        logger.info('Initializing MongoDB connection...');

        await dbConnection.connect({
            uri: config.database.mongodb.uri,
            options: config.database.mongodb.options
        });

        logger.info('MongoDB connection initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize database:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export async function disconnectDatabase(): Promise<void> {
    try {
        await dbConnection.disconnect();
        logger.info('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error disconnecting from database:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export async function checkDatabaseHealth(): Promise<{
    type: string;
    connected: boolean;
    error?: string;
}> {
    try {
        const health = await dbConnection.healthCheck();
        return {
            type: 'mongodb',
            connected: health.connected,
            error: health.error
        };
    } catch (error) {
        return {
            type: 'mongodb',
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
