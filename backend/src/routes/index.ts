import {Router} from 'express';
import * as authController from '../controllers/auth.controller';
import * as accountController from '../controllers/account.controller';
import * as transactionController from '../controllers/transaction.controller';
import * as healthController from '../controllers/health.controller';
import {requireAuth} from '../middleware';
import * as userController from "../controllers/user.controller";
import {upload} from "../middleware/upload.middleware";


const router = Router();

//Health Route (Public)
router.get('/health', healthController.health);


// Auth Routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.getStatus);


// Smart Account Routes (protected)
router.post('/accounts/create', requireAuth, accountController.createSmartAccount);
router.get('/accounts/me', requireAuth, accountController.getMySmartAccounts);
router.get('/accounts/:address', requireAuth, accountController.getSmartAccountDetails);


// Transaction Routes (protected)
router.post('/transactions/send', requireAuth, transactionController.sendTransaction);
router.get('/transactions/history', requireAuth, transactionController.getTransactionHistory);
router.post('/transactions/estimate_gas', requireAuth, transactionController.getGasEstimation);
router.put('/transactions/user_op', requireAuth, transactionController.getOperationStatus);
router.get('/transactions/gas_price', transactionController.getGasPrice);


// Profile Routes (Protected)
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.get('/username/check', requireAuth, userController.checkUsernameAvailability);
router.post('/avatar/upload', requireAuth, upload.single('profileImage'), userController.uploadProfileImage);
router.put('/avatar/config', requireAuth, userController.updateAvatarConfig);
router.delete('/avatar', requireAuth, userController.deleteProfileImage);


export {router as routes};