import {Router} from 'express';
import {AlchemyService} from '../services/AlchemyService';

const router = Router();

router.post('/create', async (req, res, next) => {
    try {
        const alchemyService = AlchemyService.getInstance();
        const client = alchemyService?.getAlchemyClient();

        if (!client || !client.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                error: {code: 'NOT_AUTHENTICATED', message: 'User not authenticated'}
            });
        }

        const addressResult = await client.getSmartAccountAddress();

        if (!addressResult.success) {
            return res.status(400).json(addressResult);
        }

        res.json({
            success: true,
            data: {
                address: addressResult.data,
                message: 'Smart account created successfully'
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:address', async (req, res, next) => {
    try {
        const {address} = req.params;

        const alchemyService = AlchemyService.getInstance();
        const client = alchemyService?.getAlchemyClient();

        if (!client) {
            return res.status(500).json({
                success: false,
                error: {code: 'CLIENT_NOT_AVAILABLE', message: 'Alchemy client not available'}
            });
        }

        const accountInfo = await client.getAccountInfo();

        if (!accountInfo.success) {
            return res.status(400).json(accountInfo);
        }

        // Convert BigInt values to strings for JSON serialization
        const responseData = {
            ...accountInfo,
            data: {
                ...accountInfo.data,
                nonce: accountInfo.data.nonce.toString(),
                balance: accountInfo.data.balance?.toString()
            }
        };

        res.json(responseData);
    } catch (error) {
        next(error);
    }
});

export {router as accountRoutes};
