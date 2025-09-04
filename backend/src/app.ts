import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {validateConfig} from './config';
import {errorHandlerMiddleware} from './middleware/errorHandler.middleware';
import {routes} from './routes';
import {createServiceLogger} from './utils';

const logger = createServiceLogger('App');

async function createApp() {
    const app = express();

    // Validate configuration
    validateConfig();
    logger.info('✅ Configuration validated');

    // Basic security headers
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false // Simplified for POC
    }));

    // CORS - Allow all origins for POC
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }));

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    // Simple request logging
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({status: 'ok', timestamp: new Date().toISOString()});
    });

    // API routes
    app.use('/api', routes);

    // Root endpoint - Simple API info
    app.get('/', (req, res) => {
        res.json({
            name: 'Nexus Smart Wallet API',
            version: '1.0.0',
            status: 'running',
            docs: {
                auth: 'POST /api/auth/authenticate',
                accounts: 'POST /api/accounts/create | GET /api/accounts/me',
                transactions: 'POST /api/transactions/send | GET /api/transactions/history',
                health: 'GET /health'
            }
        });
    });

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Not Found',
            path: req.originalUrl
        });
    });

    // Error handler (must be last)
    app.use(errorHandlerMiddleware);

    logger.info('🚀 Nexus Smart Wallet API ready');
    return app;
}

export default createApp;
