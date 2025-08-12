export interface User {
    id: string;
    email: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface CreateUserInput {
    email: string;
}

export interface UpdateUserInput {
    lastLogin?: Date;
}

// Simple validation helpers
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validateUserInput(input: CreateUserInput): string | null {
    if (!input.email) {
        return 'Email is required';
    }

    if (!validateEmail(input.email)) {
        return 'Invalid email format';
    }

    return null; // Valid
}
