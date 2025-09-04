// User domain types
export interface User {
    id: string;
    email?: string;
    password?: string;
    createdAt: Date;
    lastLogin?: Date;
}

export interface CreateUserInput {
    id?: string;
    email?: string;
    password?: string;
}

export interface UpdateUserInput {
    lastLogin?: Date;
    password?: string;
}