import dotenv from 'dotenv';

dotenv.config();

// Single centralized configuration for the entire application
export const config = {
    // App settings
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // CORS settings
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173'
    ],

    // Alchemy settings
    alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY || '',
        policyId: process.env.ALCHEMY_POLICY_ID,
        chainId: parseInt(process.env.CHAIN_ID || '84532') // Base Sepolia by default
    },

    // Database settings
    database: {
        type: 'memory' as const,
        cleanupIntervalMs: 5 * 60 * 1000 // 5 minutes
    },

    // Logger settings
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        logDir: process.env.LOG_DIR || './logs'
    },

    // Security settings
    security: {
        sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24'),
        tokenLength: 32 // bytes for session tokens
    }
} as const;

// Type-safe config export
export type Config = typeof config;

// Validation helper - throws error if critical config is missing
export function validateConfig(): void {
    if (!config.alchemy.apiKey && config.nodeEnv === 'production') {
        throw new Error('ALCHEMY_API_KEY is required in production');
    }

    if (config.port < 1 || config.port > 65535) {
        throw new Error('PORT must be a valid port number (1-65535)');
    }
}

// Development helper - shows current config (safe for logging)
export function getConfigSummary() {
    return {
        port: config.port,
        nodeEnv: config.nodeEnv,
        corsOrigins: config.corsOrigins,
        alchemy: {
            hasApiKey: !!config.alchemy.apiKey,
            hasPolicyId: !!config.alchemy.policyId,
            chainId: config.alchemy.chainId
        },
        database: {
            type: config.database.type
        },
        logger: {
            level: config.logger.level,
            logDir: config.logger.logDir
        }
    };
}
