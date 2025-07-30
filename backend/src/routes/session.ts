import {Router} from 'express';
import {SessionKey} from '../types';

const router = Router();

// Mock session keys storage (in production, use database)
const sessionKeys: SessionKey[] = [];

router.post('/create', async (req, res, next) => {
    try {
        const {permissions, expiresAt} = req.body;

        if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                success: false,
                error: {code: 'INVALID_PERMISSIONS', message: 'Non-empty permissions array is required'}
            });
        }

        const sessionKey: SessionKey = {
            id: `session_${Date.now()}`,
            publicKey: `0x${'0'.repeat(64)}`, // Mock public key
            permissions,
            expiresAt: new Date(expiresAt || Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
            isActive: true
        };

        sessionKeys.push(sessionKey);

        res.json({
            success: true,
            data: sessionKey
        });
    } catch (error) {
        next(error);
    }
});

router.get('/list', async (req, res, next) => {
    try {
        const activeKeys = sessionKeys.filter(key =>
            key.isActive && key.expiresAt > new Date()
        );

        res.json({
            success: true,
            data: activeKeys
        });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;

        const keyIndex = sessionKeys.findIndex(key => key.id === id);
        if (keyIndex === -1) {
            return res.status(404).json({
                success: false,
                error: {code: 'SESSION_KEY_NOT_FOUND', message: 'Session key not found'}
            });
        }

        // Check if session is already revoked
        if (!sessionKeys[keyIndex].isActive) {
            return res.status(404).json({
                success: false,
                error: {code: 'SESSION_KEY_NOT_FOUND', message: 'Session key already revoked'}
            });
        }

        sessionKeys[keyIndex].isActive = false;

        res.json({
            success: true,
            data: {message: 'Session key revoked successfully'}
        });
    } catch (error) {
        next(error);
    }
});

// Test helper function to clear session keys
export function clearAllSessionKeys() {
    sessionKeys.length = 0;
}

export {router as sessionRoutes};
