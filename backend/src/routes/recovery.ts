import {Router} from 'express';
import {RecoveryRequest} from '../types';

const router = Router();

// Mock recovery requests storage
const recoveryRequests: RecoveryRequest[] = [];

router.post('/initiate', async (req, res, next) => {
    try {
        const {accountAddress, guardians, threshold} = req.body;

        // Validate required fields
        if (!accountAddress || !guardians || threshold === undefined || threshold === null) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'Account address, guardians, and threshold are required'
                }
            });
        }

        // Validate guardians array is not empty
        if (!Array.isArray(guardians) || guardians.length === 0) {
            return res.status(400).json({
                success: false,
                error: {code: 'MISSING_REQUIRED_FIELDS', message: 'Guardians array cannot be empty'}
            });
        }

        const recoveryRequest: RecoveryRequest = {
            id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            accountAddress,
            guardians,
            threshold,
            status: 'pending',
            createdAt: new Date()
        };

        recoveryRequests.push(recoveryRequest);

        res.json({
            success: true,
            data: recoveryRequest
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/status', async (req, res, next) => {
    try {
        const {id} = req.params;

        const request = recoveryRequests.find(req => req.id === id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: {code: 'RECOVERY_REQUEST_NOT_FOUND', message: 'Recovery request not found'}
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
});

// Test helper function to clear recovery requests
export function clearAllRecoveryRequests() {
    recoveryRequests.length = 0;
}

export {router as recoveryRoutes};
