import {Application} from 'express';
import request from 'supertest';
import {AlchemyService} from '../../src/services/AlchemyService';

export interface TestUser {
    email: string;
    userId: string;
}

export interface TestAccount {
    address: string;
    balance: string;
    nonce: string;
}

export interface TestSession {
    id: string;
    publicKey: string;
    permissions: any[];
    expiresAt: string;
    isActive: boolean;
}

/**
 * Test helper class for API testing
 */
export class ApiTestHelper {
    constructor(private app: Application) {
    }

    /**
     * Authenticate a test user
     */
    async authenticateUser(email: string = 'test@nexuswallet.com'): Promise<TestUser> {
        const response = await request(this.app)
            .post('/api/auth/connect')
            .send({email, type: 'email'})
            .expect(200);

        expect(response.body.success).toBe(true);
        return response.body.data;
    }

    /**
     * Create a smart account
     */
    async createSmartAccount(): Promise<TestAccount> {
        const response = await request(this.app)
            .post('/api/accounts/create')
            .expect(200);

        expect(response.body.success).toBe(true);
        return response.body.data;
    }

    /**
     * Create a session key
     */
    async createSessionKey(permissions: any[] = []): Promise<TestSession> {
        const defaultPermissions = [
            {
                target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                allowedFunctions: ['transfer'],
                spendingLimit: '1000000000000000000'
            }
        ];

        const response = await request(this.app)
            .post('/api/session/create')
            .send({
                permissions: permissions.length > 0 ? permissions : defaultPermissions,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            })
            .expect(200);

        expect(response.body.success).toBe(true);
        return response.body.data;
    }

    /**
     * Send a test transaction
     */
    async sendTransaction(to: string, value: string = '100000000000000000', data: string = '0x') {
        const response = await request(this.app)
            .post('/api/transactions/send')
            .send({to, value, data})
            .expect(200);

        expect(response.body.success).toBe(true);
        return response.body.data;
    }

    /**
     * Initiate recovery process
     */
    async initiateRecovery(accountAddress: string, guardians: string[], threshold: number = 1) {
        const response = await request(this.app)
            .post('/api/recovery/initiate')
            .send({accountAddress, guardians, threshold})
            .expect(200);

        expect(response.body.success).toBe(true);
        return response.body.data;
    }

    /**
     * Disconnect user
     */
    async disconnectUser(): Promise<void> {
        await request(this.app)
            .post('/api/auth/disconnect')
            .expect(200);
    }
}

/**
 * Mock data generators
 */
export class MockDataGenerator {
    static generateEthereumAddress(): string {
        const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(20)));
        return '0x' + randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static generateTransactionHash(): string {
        const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
        return '0x' + randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static generateUserId(): string {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static generateRecoveryId(): string {
        return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static generateUser(email?: string): TestUser {
        return {
            email: email || `test${Math.random().toString(36).substr(2, 5)}@nexuswallet.com`,
            userId: this.generateUserId()
        };
    }

    static generateSessionPermissions() {
        return [
            {
                target: this.generateEthereumAddress(),
                allowedFunctions: ['transfer', 'approve'],
                spendingLimit: '1000000000000000000', // 1 ETH
                timeLimit: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            }
        ];
    }
}

/**
 * Test database helpers (for in-memory data cleanup)
 */
export class TestDataCleaner {
    static clearSessionKeys(): void {
        // Clear session keys from in-memory storage
        try {
            // Import session storage to clear it
            const sessionModule = require('../../src/routes/session');
            if (sessionModule && sessionModule.clearAllSessionKeys) {
                sessionModule.clearAllSessionKeys();
            }
        } catch (error) {
            // If module doesn't exist or doesn't have the method, it's okay
        }
    }

    static clearRecoveryRequests(): void {
        // Clear recovery requests from in-memory storage
        try {
            const recoveryModule = require('../../src/routes/recovery');
            if (recoveryModule && recoveryModule.clearAllRecoveryRequests) {
                recoveryModule.clearAllRecoveryRequests();
            }
        } catch (error) {
            // If module doesn't exist or doesn't have the method, it's okay
        }
    }

    static resetAlchemyService(): void {
        // Reset the Alchemy service singleton
        const service = AlchemyService.getInstance();
        if (service && service.getAlchemyClient()) {
            service.getAlchemyClient()?.logout();
        }
    }

    static clearAllTestData(): void {
        this.clearSessionKeys();
        this.clearRecoveryRequests();
        this.resetAlchemyService();
    }
}

/**
 * Custom Jest matchers for API responses
 */
export const customMatchers = {
    toBeValidApiResponse: function (received: any) {
        const hasSuccess = received && typeof received.success === 'boolean';
        const hasData = received.success === true && received.data !== undefined;
        const hasError = received.success === false && received.error !== undefined;
        const pass = hasSuccess && (hasData || hasError);

        return {
            pass,
            message: () => pass
                ? `Expected ${JSON.stringify(received)} not to be a valid API response`
                : `Expected ${JSON.stringify(received)} to be a valid API response with success and data/error fields`
        };
    },

    toBeValidEthereumAddress: function (received: string) {
        const pass = typeof received === 'string' &&
            received.startsWith('0x') &&
            received.length === 42;

        return {
            pass,
            message: () => pass
                ? `Expected ${received} not to be a valid Ethereum address`
                : `Expected ${received} to be a valid Ethereum address (0x + 40 hex chars)`
        };
    },

    toBeValidTransactionHash: function (received: string) {
        const pass = typeof received === 'string' &&
            received.startsWith('0x') &&
            received.length === 66;

        return {
            pass,
            message: () => pass
                ? `Expected ${received} not to be a valid transaction hash`
                : `Expected ${received} to be a valid transaction hash (0x + 64 hex chars)`
        };
    }
};

// Extend Jest matchers
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidApiResponse(): R;

            toBeValidEthereumAddress(): R;

            toBeValidTransactionHash(): R;
        }
    }
}

// Register custom matchers
beforeAll(() => {
    expect.extend(customMatchers);
});
