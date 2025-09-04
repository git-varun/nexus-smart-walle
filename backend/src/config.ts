import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // CORS
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],

    // Alchemy
    alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY || '',
        policyId: process.env.ALCHEMY_POLICY_ID || '',
        chainId: parseInt(process.env.CHAIN_ID || '84532'), // Base Sepolia
        factoryAddress: process.env.CHAIN_FACTORY_ADDRESS || '0x00000000000017c61b5bEe81050EC8eFc9c6fecd',
        defaultAAVersion: (process.env.AA_VERSION as '0.6' | '0.7') || '0.6',
        entryPointV06: process.env.CHAIN_ENTRY_POINT_V06 || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        entryPointV07: process.env.CHAIN_ENTRY_POINT_V07 || '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        walletApiUrl: `https://api.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || 'demo'}`,
    },

    // Wallet
    centralWallet: {
        privateKey: process.env.MASTER_WALLET_PRIVATE_KEY || '',
        enabled: process.env.MASTER_WALLET_ENABLED === 'true'
    },

    // Database
    database: {
        mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-wallet',
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        }
    },

    // Security
    security: {
        jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        sessionExpiryHours: 24
    }
};

export function validateConfig(): void {
    const required = [
        {key: 'ALCHEMY_API_KEY', value: config.alchemy.apiKey},
        {key: 'MONGODB_URI', value: config.database.mongodb.uri}
    ];

    // Only validate in production or when explicitly needed
    if (config.nodeEnv === 'production') {
        for (const {key, value} of required) {
            if (!value) throw new Error(`${key} is required`);
        }
    }

    // Validate wallet key format if provided
    if (config.centralWallet.privateKey) {
        if (!config.centralWallet.privateKey.startsWith('0x') ||
            config.centralWallet.privateKey.length !== 66) {
            throw new Error('MASTER_WALLET_PRIVATE_KEY must be valid hex (0x + 64 chars)');
        }
    }
}

// Helper to get config summary for logging
export function getConfigSummary() {
    return {
        env: config.nodeEnv,
        port: config.port,
        chainId: config.alchemy.chainId,
        hasAlchemyKey: !!config.alchemy.apiKey,
        hasWalletKey: !!config.centralWallet.privateKey,
        dbUri: config.database.mongodb.uri.replace(/\/\/[^@]*@/, '//***:***@') // Hide credentials
    };
}
