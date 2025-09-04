import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import * as accountController from '../controllers/account.controller';
import * as transactionController from '../controllers/transaction.controller';
import {requireAuth} from '../middleware';

const router = Router();

// Auth routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.getStatus);

// Smart account routes (protected)
router.post('/accounts', requireAuth, accountController.createOrGetSmartAccount);
router.get('/accounts/me', requireAuth, accountController.getMySmartAccounts);
router.get('/accounts/:address', requireAuth, accountController.getSmartAccountDetails);

// Transaction routes (protected)
router.post('/transactions/send', requireAuth, transactionController.sendTransaction);
router.get('/transactions/history', requireAuth, transactionController.getTransactionHistory);
router.post('/transactions/estimate_gas', requireAuth, transactionController.getGasEstimation);
router.put('/transactions/userOp', requireAuth, transactionController.getOperationStatus);

export {router as routes};
