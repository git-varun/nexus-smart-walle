// User domain types
export interface User {
    id: string;
    email?: string;
    username?: string;        // Custom username
    displayName?: string;     // Display name for the user
    profileImageUrl?: string; // URL for uploaded profile image
    avatarConfig?: {          // Configuration for generated avatars
        seed: string;
        style: string;
        backgroundColor: string;
        textColor: string;
        pattern: string;
    };
    preferences?: {           // User preferences and settings
        theme: 'light' | 'dark' | 'auto';
        language: string;
        notifications: boolean;
        privacy: {
            showEmail: boolean;
            showOnlineStatus: boolean;
        };
    };
    createdAt: Date;
    lastLogin?: Date;
}

export interface CreateUserInput {
    id?: string;
    email?: string;
    username?: string;
    displayName?: string;
    password?: string;
}

export interface UpdateUserInput {
    username?: string;
    displayName?: string;
    profileImageUrl?: string;
    avatarConfig?: {
        seed: string;
        style: string;
        backgroundColor: string;
        textColor: string;
        pattern: string;
    };
    preferences?: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        notifications: boolean;
        privacy: {
            showEmail: boolean;
            showOnlineStatus: boolean;
        };
    };
    lastLogin?: Date;
    password?: string;
}

export interface UserProfileUpdate {
    username?: string;
    displayName?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'auto';
        language?: string;
        notifications?: boolean;
        privacy?: {
            showEmail?: boolean;
            showOnlineStatus?: boolean;
        };
    };
}

export interface UsernameAvailabilityCheck {
    username: string;
    available: boolean;
    suggestions?: string[];
}