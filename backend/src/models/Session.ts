export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface CreateSessionInput {
    userId: string;
    token: string;
    expiresAt: Date;
}

// Simple validation helpers
export function validateSessionToken(token: string): boolean {
    // Token should be a hex string of at least 32 characters
    const tokenRegex = /^[a-fA-F0-9]{32,}$/;
    return tokenRegex.test(token);
}

export function validateSessionInput(input: CreateSessionInput): string | null {
    if (!input.userId) {
        return 'User ID is required';
    }

    if (!input.token) {
        return 'Token is required';
    }

    if (!validateSessionToken(input.token)) {
        return 'Invalid token format';
    }

    if (!input.expiresAt) {
        return 'Expiration date is required';
    }

    if (input.expiresAt <= new Date()) {
        return 'Expiration date must be in the future';
    }

    return null; // Valid
}

export function isSessionExpired(session: Session): boolean {
    return session.expiresAt <= new Date();
}

export function isSessionValid(session: Session): boolean {
    return !isSessionExpired(session) && validateSessionToken(session.token);
}
