import mongoose from 'mongoose';
import {createServiceLogger} from '../utils';

const logger = createServiceLogger('MongoDB');

interface ConnectionOptions {
    uri: string;
    options?: mongoose.ConnectOptions;
}

let isConnected = false;

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private connection: typeof mongoose | null = null;

    private constructor() {
    }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async connect(connectionOptions: ConnectionOptions): Promise<void> {
        if (isConnected) {
            logger.info('Already connected to MongoDB');
            return;
        }

        try {
            const options: mongoose.ConnectOptions = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                ...connectionOptions.options
            };

            logger.info('Connecting to MongoDB…', connectionOptions);
            this.connection = await mongoose.connect(connectionOptions.uri, connectionOptions.options);

            isConnected = true;
            logger.info('Successfully connected to MongoDB');

            // Handle connection events
            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
                isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
                isConnected = true;
            });

        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error instanceof Error ? error : new Error(String(error)));
            isConnected = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!isConnected) {
            logger.info('Not connected to MongoDB');
            return;
        }

        try {
            await mongoose.disconnect();
            isConnected = false;
            logger.info('Disconnected from MongoDB');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    isConnected(): boolean {
        return isConnected && mongoose.connection.readyState === 1;
    }

    getConnection(): typeof mongoose | null {
        return this.connection;
    }

    async healthCheck(): Promise<{
        connected: boolean;
        readyState: number;
        host?: string;
        name?: string;
        error?: string;
    }> {
        try {
            const state = mongoose.connection.readyState;
            const connected = state === 1;

            return {
                connected,
                readyState: state,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            };
        } catch (error) {
            return {
                connected: false,
                readyState: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Singleton instance
export const dbConnection = DatabaseConnection.getInstance();
