import {Request} from 'express';

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

// Authenticated request interface
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
    session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
    };
}

// API Error interface for error handling middleware
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
