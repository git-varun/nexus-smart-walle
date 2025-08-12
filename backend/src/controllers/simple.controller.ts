import {NextFunction, Request, Response} from 'express';
import {AlchemyService} from '../services/AlchemyService';

// Single global instance (uses centralized config)
const alchemyService = new AlchemyService();

// Auth endpoints
export const connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(400).json({error: 'Email required'});
        }

        const result = await alchemyService.authenticate(email);
        if (result.success) {
            res.json({success: true, user: result.data});
        } else {
            res.status(400).json({success: false, error: result.error});
        }
    } catch (error) {
        next(error);
    }
};

export const disconnect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        alchemyService.logout();
        res.json({success: true});
    } catch (error) {
        next(error);
    }
};

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAuthenticated = alchemyService.isAuthenticated();
        const user = alchemyService.getCurrentUser();

        res.json({
            authenticated: isAuthenticated,
            user: user
        });
    } catch (error) {
        next(error);
    }
};

// Account endpoints
export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!alchemyService.isAuthenticated()) {
            return res.status(401).json({error: 'Not authenticated'});
        }

        const addressResult = await alchemyService.getSmartAccountAddress();
        const accountResult = await alchemyService.getAccountInfo();

        if (addressResult.success && accountResult.success) {
            res.json({
                success: true,
                address: addressResult.data,
                accountInfo: accountResult.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: addressResult.error || accountResult.error
            });
        }
    } catch (error) {
        next(error);
    }
};

export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {address} = req.params;

        if (!alchemyService.isAuthenticated()) {
            return res.status(401).json({error: 'Not authenticated'});
        }

        const result = await alchemyService.getAccountInfo();
        if (result.success) {
            res.json({success: true, account: result.data});
        } else {
            res.status(500).json({success: false, error: result.error});
        }
    } catch (error) {
        next(error);
    }
};

// Transaction endpoints
export const sendTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {to, data, value} = req.body;

        if (!to) {
            return res.status(400).json({error: 'Recipient address required'});
        }

        if (!alchemyService.isAuthenticated()) {
            return res.status(401).json({error: 'Not authenticated'});
        }

        const result = await alchemyService.sendTransaction({
            to,
            data,
            value: value ? BigInt(value) : undefined
        });

        if (result.success) {
            res.json({success: true, transaction: result.data});
        } else {
            res.status(500).json({success: false, error: result.error});
        }
    } catch (error) {
        next(error);
    }
};

// Health check
export const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await alchemyService.healthCheck();

        if (result.success) {
            res.json({
                status: 'healthy',
                alchemy: result.data
            });
        } else {
            res.status(503).json({
                status: 'unhealthy',
                error: result.error
            });
        }
    } catch (error) {
        next(error);
    }
};
