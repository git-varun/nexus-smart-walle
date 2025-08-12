import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {config, getConfigSummary, validateConfig} from './config';
import {errorHandler} from './middleware/errorHandler';
import {routes} from './routes';
// Database initialization is handled by repositories automatically
import {createServiceLogger} from './utils/logger';

const logger = createServiceLogger('App');

export async function createApp() {
    const app = express();

    // Validate configuration
    try {
        validateConfig();
        logger.info('Configuration validated successfully');
    } catch (error) {
        logger.error('Configuration validation failed', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }

    // Database is automatically initialized by repositories when needed

    logger.info('Initializing Nexus Smart Wallet Backend', getConfigSummary());

    // Security middleware
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));

    // CORS configuration
    const corsOptions = {
        origin: config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    };

    app.use(cors(corsOptions));

    // Body parsing middleware
    app.use(express.json({limit: '10mb'}));
    app.use(express.urlencoded({extended: true}));

    // Request logging middleware (development only)
    if (config.nodeEnv !== 'production') {
        app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                hasAuth: !!req.headers.authorization
            });
            next();
        });
    }

    // API routes
    app.use('/api', routes);

    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            name: 'Nexus Smart Wallet Backend',
            version: '1.0.0',
            architecture: 'MVC with Repository Pattern',
            status: 'running',
            endpoints: {
                auth: {
                    authenticate: 'POST /api/auth/authenticate',
                    logout: 'POST /api/auth/logout',
                    status: 'GET /api/auth/status'
                },
                accounts: {
                    create: 'POST /api/accounts/create',
                    getUserAccounts: 'GET /api/accounts/me',
                    getByAddress: 'GET /api/accounts/:address'
                },
                transactions: {
                    send: 'POST /api/transactions/send',
                    history: 'GET /api/transactions/history',
                    getByHash: 'GET /api/transactions/:hash',
                    estimateGas: 'POST /api/transactions/estimate-gas'
                },
                system: {
                    health: 'GET /api/health',
                    stats: 'GET /api/stats'
                }
            }
        });
    });

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
            path: req.originalUrl,
            method: req.method
        });
    });

    // Error handling middleware (must be last)
    app.use(errorHandler);

    logger.info('Nexus Smart Wallet Backend initialized successfully');
    return app;
}

export default createApp;
