import type {User} from './User';

// Authentication result interface
export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    smartAccountAddress?: string;
    error?: string;
}

// Session validation result interface
export interface SessionValidationResult {
    success: boolean;
    user?: User;
    error?: string;
}

// Authentication status result interface
export interface AuthStatusResult {
    success: boolean;
    authenticated: boolean;
    user?: User;
    smartAccountAddress?: string;
    alchemyStatus?: boolean;
    error?: string;
}

// Authentication parameters interface
export interface AuthenticateUserParams {
    email: string;
}
