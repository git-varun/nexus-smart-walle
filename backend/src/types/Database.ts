import {Document} from 'mongoose';
import type {Session, SmartAccount, Transaction, User} from './index';

// ============================================================================
// DATABASE DOCUMENT TYPES
// ============================================================================

// MongoDB document interfaces that extend the base types
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
