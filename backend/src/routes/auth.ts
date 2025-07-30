import {Router} from 'express';
import {AlchemyService} from '../services/AlchemyService';

const router = Router();

router.post('/connect', async (req, res, next) => {
    try {
        const {email, type = 'email'} = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: {code: 'MISSING_EMAIL', message: 'Email is required'}
            });
        }

        const alchemyService = AlchemyService.getInstance();
        if (!alchemyService) {
            return res.status(500).json({
                success: false,
                error: {code: 'SERVICE_NOT_INITIALIZED', message: 'Alchemy service not initialized'}
            });
        }

        const client = alchemyService.getAlchemyClient();
        if (!client) {
            return res.status(500).json({
                success: false,
                error: {code: 'CLIENT_NOT_AVAILABLE', message: 'Alchemy client not available'}
            });
        }

        const result = await client.authenticate({type, email});

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/disconnect', async (req, res, next) => {
    try {
        const alchemyService = AlchemyService.getInstance();
        const client = alchemyService?.getAlchemyClient();

        if (client) {
            await client.logout();
        }

        res.json({
            success: true,
            data: {message: 'Disconnected successfully'}
        });
    } catch (error) {
        next(error);
    }
});

router.get('/status', async (req, res, next) => {
    try {
        const alchemyService = AlchemyService.getInstance();
        const client = alchemyService?.getAlchemyClient();

        if (!client) {
            return res.json({
                success: true,
                data: {isAuthenticated: false, user: null}
            });
        }

        const isAuthenticated = client.isAuthenticated();
        const user = client.getCurrentUser();

        res.json({
            success: true,
            data: {isAuthenticated, user}
        });
    } catch (error) {
        next(error);
    }
});

export {router as authRoutes};
