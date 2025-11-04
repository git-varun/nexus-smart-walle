// Frontend User types - matching backend types
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

export interface ProfileImageUpload {
    file: File;
    preview?: string;
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko';

export interface UserPreferences {
    theme: Theme;
    language: Language;
    notifications: boolean;
    privacy: {
        showEmail: boolean;
        showOnlineStatus: boolean;
    };
}

// Default values
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    theme: 'auto',
    language: 'en',
    notifications: true,
    privacy: {
        showEmail: false,
        showOnlineStatus: true
    }
};

export const SUPPORTED_LANGUAGES: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    zh: '中文',
    ko: '한국어'
};

// Username validation rules
export const USERNAME_RULES = {
    minLength: 3,
    maxLength: 20,
    allowedCharacters: /^[a-zA-Z0-9_-]+$/,
    reservedWords: [
        'admin', 'administrator', 'root', 'user', 'guest', 'api', 'www', 'mail', 'email',
        'support', 'help', 'info', 'contact', 'about', 'privacy', 'terms', 'legal',
        'nexus', 'smart', 'wallet', 'account', 'profile', 'settings'
    ]
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
    if (!username || username.length < USERNAME_RULES.minLength) {
        return {valid: false, error: `Username must be at least ${USERNAME_RULES.minLength} characters`};
    }

    if (username.length > USERNAME_RULES.maxLength) {
        return {valid: false, error: `Username must not exceed ${USERNAME_RULES.maxLength} characters`};
    }

    if (!USERNAME_RULES.allowedCharacters.test(username)) {
        return {valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores'};
    }

    if (USERNAME_RULES.reservedWords.includes(username.toLowerCase())) {
        return {valid: false, error: 'This username is reserved and cannot be used'};
    }

    return {valid: true};
};