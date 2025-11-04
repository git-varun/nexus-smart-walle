import {Request, Response} from 'express';
import {
    checkAvailability,
    getUserById,
    updateConfig,
    updateProfileImage,
    updateUserProfile
} from '../services/user.service';
import {UserProfileUpdate} from '../types/User';
import {getUserId} from "../middleware";
import {createServiceLogger} from "../utils";


const logger = createServiceLogger('UserController');


export async function getProfile(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: 'User not authenticated', code: 'UNAUTHORIZED'}
            });
        }

        const result = await getUserById(userId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.json({
            success: true,
            data: {
                user: result.user
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            error: {message: 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}

export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: 'User not authenticated', code: 'UNAUTHORIZED'}
            });
        }

        const updates: UserProfileUpdate = req.body;

        // Validate input
        if (updates.username && (updates.username.length < 3 || updates.username.length > 20)) {
            return res.status(400).json({
                success: false,
                error: {message: 'Username must be between 3 and 20 characters', code: 'INVALID_INPUT'}
            });
        }

        if (updates.displayName && updates.displayName.length > 50) {
            return res.status(400).json({
                success: false,
                error: {message: 'Display name cannot exceed 50 characters', code: 'INVALID_INPUT'}
            });
        }

        const result = await updateUserProfile(userId, updates);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: {
                user: result.user
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            error: {message: 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}

export async function checkUsernameAvailability(req: Request, res: Response) {
    try {
        const {username} = req.query;
        const userId = getUserId(req);

        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                success: false,
                error: {message: 'Username is required', code: 'INVALID_INPUT'}
            });
        }

        // Basic validation
        if (username.length < 3 || username.length > 20) {
            return res.json({
                success: true,
                data: {
                    username,
                    available: false,
                    suggestions: []
                }
            });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.json({
                success: true,
                data: {
                    username,
                    available: false,
                    suggestions: []
                }
            });
        }

        const result = await checkAvailability(username, userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error checking username availability:', error);
        res.status(500).json({
            success: false,
            error: {message: 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}

export async function uploadProfileImage(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: 'User not authenticated', code: 'UNAUTHORIZED'}
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {message: 'No file uploaded', code: 'NO_FILE'}
            });
        }

        const profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
        const result = await updateProfileImage(userId, profileImageUrl);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: {profileImageUrl, user: result.user}
        });
    } catch (error: any) {
        logger.error('Error uploading profile image', error, getUserId(req));
        res.status(500).json({
            success: false,
            error: {message: error.message || 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}

export async function updateAvatarConfig(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: 'User not authenticated', code: 'UNAUTHORIZED'}
            });
        }

        const {avatarConfig} = req.body;

        if (!avatarConfig) {
            return res.status(400).json({
                success: false,
                error: {message: 'Avatar configuration is required', code: 'INVALID_INPUT'}
            });
        }

        const result = await updateConfig(userId, avatarConfig);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: {
                user: result.user
            }
        });
    } catch (error) {
        console.error('Error updating avatar config:', error);
        res.status(500).json({
            success: false,
            error: {message: 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}

export async function deleteProfileImage(req: Request, res: Response) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: 'User not authenticated', code: 'UNAUTHORIZED'}
            });
        }

        const result = await updateProfileImage(userId, '');

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            data: {
                user: result.user
            }
        });
    } catch (error) {
        console.error('Error deleting profile image:', error);
        res.status(500).json({
            success: false,
            error: {message: 'Internal server error', code: 'SERVER_ERROR'}
        });
    }
}