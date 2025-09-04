// Authentication middleware
export {
    requireAuth,      // Primary authentication middleware
    getUserId,
    getToken
} from './auth.middleware';

// Export types from types folder
export type {AuthenticatedRequest} from '../types/api';
