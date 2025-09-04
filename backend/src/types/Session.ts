// Session domain types
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