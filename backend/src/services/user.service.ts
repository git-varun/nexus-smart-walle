import {userRepository} from '../repositories';
import {CreateUserInput, User, UsernameAvailabilityCheck, UserProfileUpdate} from '../types/User';
import {IUser} from '../models';
import bcrypt from 'bcryptjs';
import {createServiceLogger} from "../utils";

const logger = createServiceLogger("UserService");

export async function createUser(input: CreateUserInput): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        // Check if email already exists
        if (input.email) {
            const existingUser = await userRepository.findByEmail(input.email);
            if (existingUser) {
                return {
                    success: false,
                    error: {message: 'User with this email already exists', code: 'EMAIL_EXISTS'}
                };
            }
        }

        // Check if username already exists
        if (input.username) {
            const existingUsername = await userRepository.findByUsername(input.username);
            if (existingUsername) {
                return {
                    success: false,
                    error: {message: 'Username already taken', code: 'USERNAME_EXISTS'}
                };
            }
        }

        // Hash password if provided
        let hashedPassword = '';
        if (input.password) {
            hashedPassword = await bcrypt.hash(input.password, 12);
        }

        const userData: any = {
            ...input,
            password: hashedPassword,
            preferences: {
                theme: 'auto',
                language: 'en',
                notifications: true,
                privacy: {
                    showEmail: false,
                    showOnlineStatus: true
                }
            }
        };

        const createdUser = await userRepository.createUser(userData);

        return {
            success: true,
            user: transformUserToResponse(createdUser)
        };
    } catch (error) {
        logger.error('Error creating user:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to create user', code: 'CREATION_FAILED'}
        };
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        const user = await userRepository.findById(userId);
        if (!user) {
            return {
                success: false,
                error: {message: 'User not found', code: 'USER_NOT_FOUND'}
            };
        }

        return {
            success: true,
            user: transformUserToResponse(user)
        };
    } catch (error) {
        logger.error('Error getting user by ID:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to get user', code: 'GET_FAILED'}
        };
    }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return {
                success: false,
                error: {message: 'User not found', code: 'USER_NOT_FOUND'}
            };
        }

        return {
            success: true,
            user: transformUserToResponse(user)
        };
    } catch (error) {
        logger.error('Error getting user by email:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to get user', code: 'GET_FAILED'}
        };
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        // Check if username is being updated and if it is available.
        if (updates.username) {
            const existingUsername = await userRepository.findByUsername(updates.username);
            if (existingUsername && existingUsername.id !== userId) {
                return {
                    success: false,
                    error: {message: 'Username already taken', code: 'USERNAME_EXISTS'}
                };
            }
        }

        const updateData: Partial<IUser> = {};

        if (updates.username !== undefined) updateData.username = updates.username;
        if (updates.displayName !== undefined) updateData.displayName = updates.displayName;

        if (updates.preferences) {
            // Merge preferences with existing ones
            const currentUser = await userRepository.findById(userId);
            if (currentUser) {
                updateData.preferences = {
                    ...currentUser.preferences,
                    ...updates.preferences,
                    privacy: {
                        ...currentUser.preferences?.privacy,
                        ...updates.preferences?.privacy
                    }
                };
            }
        }

        const updatedUser = await userRepository.updateUser(userId, updateData);
        if (!updatedUser) {
            return {
                success: false,
                error: {message: 'User not found', code: 'USER_NOT_FOUND'}
            };
        }

        return {
            success: true,
            user: transformUserToResponse(updatedUser)
        };
    } catch (error) {
        logger.error('Error updating user profile:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to update profile', code: 'UPDATE_FAILED'}
        };
    }
}

/**
 * Update profile image
 */
export async function updateProfileImage(userId: string, profileImageUrl: string): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        const updatedUser = await userRepository.updateUser(userId, {profileImageUrl});
        if (!updatedUser) {
            return {
                success: false,
                error: {message: 'User not found', code: 'USER_NOT_FOUND'}
            };
        }

        return {
            success: true,
            user: transformUserToResponse(updatedUser)
        };
    } catch (error) {
        logger.error('Error updating profile image:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to update profile image', code: 'UPDATE_FAILED'}
        };
    }
}


export async function checkAvailability(username: string, currentUserId: string | null): Promise<UsernameAvailabilityCheck> {
    try {
        const existingUser = await userRepository.findByUsername(username);

        if (!existingUser || (currentUserId && existingUser.id === currentUserId)) {
            return {
                username,
                available: true
            };
        }

        // Generate suggestions based on the requested username
        const suggestions = await generateUsernameSuggestions(username);

        return {
            username,
            available: false,
            suggestions
        };
    } catch (error) {
        logger.error('Error checking username availability:', error as Error);
        return {
            username,
            available: false
        };
    }
}

/**
 * Generate username suggestions
 */
async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
    const suggestions: string[] = [];
    const maxSuggestions = 5;

    // Try adding numbers
    for (let i = 1; i <= 99 && suggestions.length < maxSuggestions; i++) {
        const suggestion = `${baseUsername}${i}`;
        try {
            const exists = await userRepository.findByUsername(suggestion);
            if (!exists) {
                suggestions.push(suggestion);
            }
        } catch (error) {
            logger.error("Error while suggesting username", error as Error)
            // Continue with next suggestion if check fails
            if (suggestions.length < maxSuggestions) {
                const prefixes = ['the', 'mr', 'ms', 'user', 'new'];
                for (const prefix of prefixes) {
                    if (suggestions.length >= maxSuggestions) break;
                    const suggestion = `${prefix}${baseUsername}`;
                    try {
                        const exists = await userRepository.findByUsername(suggestion);
                        if (!exists) {
                            suggestions.push(suggestion);
                        }
                    } catch (error: any) {
                        throw new Error(error)
                    }
                }
            }

        }
    }

    return suggestions;
}

/**
 * Update avatar config
 */
export async function updateConfig(userId: string, avatarConfig: any): Promise<{
    success: boolean;
    user?: User;
    error?: { message: string; code: string }
}> {
    try {
        const updatedUser = await userRepository.updateUser(userId, {avatarConfig});
        if (!updatedUser) {
            return {
                success: false,
                error: {message: 'User not found', code: 'USER_NOT_FOUND'}
            };
        }

        return {
            success: true,
            user: transformUserToResponse(updatedUser)
        };
    } catch (error) {
        logger.error('Error updating avatar config:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to update avatar config', code: 'UPDATE_FAILED'}
        };
    }
}

/**
 * Update last login time
 */
export async function updateLastLogin(userId: string): Promise<{
    success: boolean;
    error?: { message: string; code: string }
}> {
    try {
        await userRepository.updateUser(userId, {lastLogin: new Date()});
        return {success: true};
    } catch (error) {
        logger.error('Error updating last login:', error as Error);
        return {
            success: false,
            error: {message: 'Failed to update last login', code: 'UPDATE_FAILED'}
        };
    }
}

/**
 * Transform user document to response format
 */
function transformUserToResponse(user: IUser): User {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profileImageUrl: user.profileImageUrl,
        avatarConfig: user.avatarConfig,
        preferences: {
            theme: user.preferences?.theme || 'auto',
            language: user.preferences?.language || 'en',
            notifications: user.preferences?.notifications || true,
            privacy: {
                showEmail: user.preferences?.privacy?.showEmail || false,
                showOnlineStatus: user.preferences?.privacy?.showOnlineStatus || true
            }
        },
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    };
}