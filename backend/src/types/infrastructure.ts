import {Document} from 'mongoose';
import {Session, SmartAccount, Transaction, User} from './domain';

// ============================================================================
// INFRASTRUCTURE TYPES
// ============================================================================

// Database document types
export interface UserDocument extends Omit<User, 'id'>, Document {
    _id: string;
}

export interface SmartAccountDocument extends Omit<SmartAccount, 'id'>, Document {
    _id: string;
}

export interface TransactionDocument extends Omit<Transaction, 'id'>, Document {
    _id: string;
}

export interface SessionDocument extends Omit<Session, 'id'>, Document {
    _id: string;
}

// Database connection configuration
export interface ConnectionOptions {
    uri: string;
    dbName: string;
    fallbackToMemory?: boolean;
    dualWrite?: boolean;
}

// Logger types
export interface LogEntry {
    timestamp: string;
    level: string;
    service: string;
    message: string;
    data?: any;
    error?: Error;
    stack?: string;
    requestId?: string;
    userId?: string;
}

// Configuration types
export interface Config {
    port: number;
    nodeEnv: string;
    corsOrigins: string[];
    alchemy: {
        apiKey: string;
        policyId?: string;
        chainId: number;
        entryPointAddress: string;
        factoryAddress: string;
    };
    database: {
        useDatabase: boolean;
        mongodbUri?: string;
        mongodbDbName: string;
        fallbackToMemory: boolean;
        dualWrite: boolean;
    };
    security: {
        jwtSecret: string;
        sessionExpiryHours: number;
        tokenLength: number;
    };
}
