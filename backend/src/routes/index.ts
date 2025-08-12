import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import * as accountController from '../controllers/account.controller';
import * as transactionController from '../controllers/transaction.controller';
import {checkRepositoryHealth, getAllRepositoryStats} from '../repositories';

const router = Router();

// Auth routes
router.post('/auth/authenticate', authController.authenticate);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.getStatus);

// Account routes (protected)
router.post('/accounts/create', authController.requireAuth, accountController.createAccount);
router.get('/accounts/me', authController.requireAuth, accountController.getUserAccounts);
router.get('/accounts/:address', accountController.getAccountByAddress);

// Transaction routes (protected)
router.post('/transactions/send', authController.requireAuth, transactionController.sendTransaction);
router.get('/transactions/history', authController.requireAuth, transactionController.getTransactionHistory);
router.get('/transactions/:hash', transactionController.getTransactionByHash);
router.post('/transactions/estimate-gas', transactionController.estimateGas);

// Health and system routes
router.get('/health', async (req, res) => {
    try {
        const repositoryHealth = await checkRepositoryHealth();
        const stats = await getAllRepositoryStats();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            database: {
                healthy: repositoryHealth.healthy,
                repositories: repositoryHealth.repositories,
                stats
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});

// System stats (for monitoring)
router.get('/stats', async (req, res) => {
    try {
        const stats = await getAllRepositoryStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system statistics'
        });
    }
});

export {router as routes};
