import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
// Mock public client for testing
import {errorHandler} from './middleware/errorHandler';
import {authRoutes} from './routes/auth';
import {accountRoutes} from './routes/accounts';
import {transactionRoutes} from './routes/transactions';
import {sessionRoutes} from './routes/session';
import {recoveryRoutes} from './routes/recovery';
import {AlchemyService} from './services/AlchemyService';

dotenv.config();

export async function createApp() {
    const app = express();

    // Initialize Alchemy Service
    const alchemyConfig = {
        apiKey: process.env.ALCHEMY_API_KEY || 'test_api_key',
        chainId: 84532, // Base Sepolia
        enableGasManager: true,
        policyId: process.env.ALCHEMY_POLICY_ID || undefined
    };

    // Mock public client for testing
    const mockPublicClient = {
        getBalance: async () => BigInt('1000000000000000000'),
        getBlockNumber: async () => BigInt(12345)
    };

    const alchemyService = AlchemyService.getInstance(alchemyConfig);
    alchemyService.initialize(mockPublicClient as any);

    // Middleware
    app.use(helmet());
    app.use(cors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
        credentials: true
    }));
    app.use(express.json({limit: '10mb'}));

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/accounts', accountRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/session', sessionRoutes);
    app.use('/api/recovery', recoveryRoutes);

    // Health check
    app.get('/health', (req, res) => {
        res.json({status: 'ok', timestamp: new Date().toISOString()});
    });

    // Error handling
    app.use(errorHandler);

    return app;
}

export default createApp;
