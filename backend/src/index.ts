import createApp from './app';
import {config} from './config';
import {createServiceLogger} from './utils';
import {disconnectDatabase, initializeDatabase} from './database/init';

const logger = createServiceLogger('Server');

async function startServer() {
    try {
        const PORT = config.port || 3000;

        // Initialize database
        await initializeDatabase();

        // Create and start app
        const app = await createApp();

        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`🔗 API: http://localhost:${PORT}`);
            logger.info(`🏥 Health: http://localhost:${PORT}/health`);
            logger.info(`📖 Docs: http://localhost:${PORT}/`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('🔄 Shutting down gracefully...');

            server.close(async () => {
                try {
                    await disconnectDatabase();
                    logger.info('✅ Server stopped');
                    process.exit(0);
                } catch (error) {
                    logger.error('❌ Shutdown error', error instanceof Error ? error : new Error(String(error)));
                    process.exit(1);
                }
            });

            // Force exit after 5 seconds
            setTimeout(() => {
                logger.error('❌ Forced shutdown');
                process.exit(1);
            }, 5000);
        };

        // Shutdown handlers
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        // Error handlers
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught Exception', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error('💥 Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Failed to start server', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
    }
}

// Start server if this is the main module
if (require.main === module) {
    startServer();
}

export {startServer};
