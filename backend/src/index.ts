import {createApp} from './app';
import {config} from './config';
import {createServiceLogger} from './utils/logger';

const logger = createServiceLogger('Server');

async function startServer() {
    try {
        const PORT = config.port;
        const NODE_ENV = config.nodeEnv;

        const app = await createApp();

        const server = app.listen(PORT, () => {
            logger.info(`🚀 Nexus Smart Wallet Backend running on port ${PORT}`);
            logger.info(`📊 Environment: ${NODE_ENV}`);
            logger.info(`🔗 Base URL: http://localhost:${PORT}`);
            logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);

            logger.info('📋 Available API Endpoints:');
            logger.info('  Authentication:');
            logger.info('    POST /api/auth/authenticate - Email authentication');
            logger.info('    POST /api/auth/logout - User logout');
            logger.info('    GET  /api/auth/status - Authentication status');

            logger.info('  Accounts:');
            logger.info('    POST /api/accounts/create - Create/get smart account');
            logger.info('    GET  /api/accounts/me - Get user accounts (auth required)');
            logger.info('    GET  /api/accounts/:address - Get account by address');

            logger.info('  Transactions:');
            logger.info('    POST /api/transactions/send - Send transaction (auth required)');
            logger.info('    GET  /api/transactions/history - Get transaction history (auth required)');
            logger.info('    GET  /api/transactions/:hash - Get transaction by hash');
            logger.info('    POST /api/transactions/estimate-gas - Estimate transaction gas');

            logger.info('  System:');
            logger.info('    GET  /api/health - System health check');
            logger.info('    GET  /api/stats - Database statistics');
            logger.info('    GET  / - API documentation');
        });

        // Graceful shutdown handlers
        const shutdown = () => {
            logger.info('🔄 Received shutdown signal, closing server gracefully...');
            server.close(() => {
                logger.info('✅ Server closed successfully');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('❌ Forced server shutdown after 10 seconds');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught Exception', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled Rejection at Promise', reason instanceof Error ? reason : new Error(String(reason)));
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Failed to start server', error as Error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

export {startServer};
