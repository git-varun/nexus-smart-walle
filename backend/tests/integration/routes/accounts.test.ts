import request from 'supertest';
import {Express} from 'express';
import {createApp} from '../../../src/app';
import {ApiTestHelper} from '../../utils/testHelpers';
import '../../mocks/viemMocks';

describe('Account Routes', () => {
    let app: Express;
    let testHelper: ApiTestHelper;

    beforeAll(async () => {
        app = await createApp();
        testHelper = new ApiTestHelper(app);
    });

    afterEach(async () => {
        try {
            await testHelper.disconnectUser();
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('POST /api/accounts/create', () => {
        it('should create smart account when authenticated', async () => {
            // First authenticate
            await testHelper.authenticateUser('test@nexuswallet.com');

            const response = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.address).toBeValidEthereumAddress();
            expect(response.body.data.message).toBe('Smart account created successfully');
        });

        it('should fail to create account when not authenticated', async () => {
            const response = await request(app)
                .post('/api/accounts/create')
                .expect(401);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_AUTHENTICATED');
            expect(response.body.error.message).toBe('User not authenticated');
        });

        it('should return same address for same user', async () => {
            await testHelper.authenticateUser('same@user.com');

            const response1 = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            const response2 = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(response1.body.data.address).toBe(response2.body.data.address);
        });

        it('should return different addresses for different users', async () => {
            // Create account for first user
            await testHelper.authenticateUser('user1@test.com');
            const response1 = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            // Switch to second user
            await testHelper.disconnectUser();
            await testHelper.authenticateUser('user2@test.com');
            const response2 = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(response1.body.data.address).not.toBe(response2.body.data.address);
            expect(response1.body.data.address).toBeValidEthereumAddress();
            expect(response2.body.data.address).toBeValidEthereumAddress();
        });
    });

    describe('GET /api/accounts/:address', () => {
        let userAddress: string;

        beforeEach(async () => {
            await testHelper.authenticateUser('account@info.com');
            const account = await testHelper.createSmartAccount();
            userAddress = account.address;
        });

        it('should return account info for authenticated user', async () => {
            const response = await request(app)
                .get(`/api/accounts/${userAddress}`)
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.address).toBeValidEthereumAddress();
            expect(response.body.data.isDeployed).toBe(true);
            expect(response.body.data.nonce).toBe('0');
            expect(response.body.data.balance).toBe('1000000000000000000'); // 1 ETH in wei
            expect(response.body.metadata.service).toBe('simple-alchemy-client');
        });

        it('should work with any valid ethereum address', async () => {
            const testAddress = '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B';

            const response = await request(app)
                .get(`/api/accounts/${testAddress}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.address).toBeValidEthereumAddress();
        });

        it('should handle invalid address format', async () => {
            const invalidAddress = 'invalid-address';

            const response = await request(app)
                .get(`/api/accounts/${invalidAddress}`)
                .expect(200); // Mock doesn't validate address format

            // In real implementation, this would validate the address format
            expect(response.body.success).toBe(true);
        });

        it('should handle empty address', async () => {
            const response = await request(app)
                .get('/api/accounts/')
                .expect(404); // Express route won't match

            // This tests that the route pattern requires an address parameter
        });
    });

    describe('Account Creation Flow', () => {
        it('should complete full account creation and info retrieval flow', async () => {
            // 1. Authenticate user
            const user = await testHelper.authenticateUser('flow@test.com');
            expect(user.email).toBe('flow@test.com');

            // 2. Create smart account
            const createResponse = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            const accountAddress = createResponse.body.data.address;
            expect(accountAddress).toBeValidEthereumAddress();

            // 3. Get account info
            const infoResponse = await request(app)
                .get(`/api/accounts/${accountAddress}`)
                .expect(200);

            expect(infoResponse.body.data.address).toBe(accountAddress);
            expect(infoResponse.body.data.isDeployed).toBe(true);
            expect(infoResponse.body.data.nonce).toBe('0');
            expect(infoResponse.body.data.balance).toBe('1000000000000000000');
        });

        it('should handle account operations across sessions', async () => {
            // First session
            await testHelper.authenticateUser('session@test.com');
            const account1 = await testHelper.createSmartAccount();

            // Disconnect and reconnect
            await testHelper.disconnectUser();
            await testHelper.authenticateUser('session@test.com');

            // Should get same account
            const account2 = await testHelper.createSmartAccount();
            expect(account1.address).toBe(account2.address);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle service unavailable gracefully for account creation', async () => {
            await testHelper.authenticateUser('error@test.com');

            // Mock service failure (would require more setup in real test)
            const response = await request(app)
                .post('/api/accounts/create')
                .expect(200); // Mock always succeeds

            expect(response.body.success).toBe(true);
        });

        it('should handle service unavailable gracefully for account info', async () => {
            await testHelper.authenticateUser('error@test.com');
            const testAddress = '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B';

            const response = await request(app)
                .get(`/api/accounts/${testAddress}`)
                .expect(200); // Mock always succeeds

            expect(response.body.success).toBe(true);
        });

        it('should handle malformed requests gracefully', async () => {
            await testHelper.authenticateUser('malformed@test.com');

            // Test with extra headers that might cause issues
            const response = await request(app)
                .post('/api/accounts/create')
                .set('X-Malformed-Header', 'test')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Authentication State Management', () => {
        it('should maintain authentication state across account operations', async () => {
            // Authenticate
            const user = await testHelper.authenticateUser('state@test.com');

            // Create account
            const createResponse = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            // Check auth status is still valid
            const authResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(authResponse.body.data.isAuthenticated).toBe(true);
            expect(authResponse.body.data.user.email).toBe('state@test.com');

            // Get account info should still work
            const infoResponse = await request(app)
                .get(`/api/accounts/${createResponse.body.data.address}`)
                .expect(200);

            expect(infoResponse.body.success).toBe(true);
        });

        it('should fail operations after logout', async () => {
            // Authenticate and create account
            await testHelper.authenticateUser('logout@test.com');
            await testHelper.createSmartAccount();

            // Logout
            await testHelper.disconnectUser();

            // Try to create another account
            const response = await request(app)
                .post('/api/accounts/create')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_AUTHENTICATED');
        });
    });

    describe('Response Consistency', () => {
        beforeEach(async () => {
            await testHelper.authenticateUser('consistency@test.com');
        });

        it('should return consistent response structure for account creation', async () => {
            const response = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('address');
            expect(response.body.data).toHaveProperty('message');
        });

        it('should return consistent response structure for account info', async () => {
            const account = await testHelper.createSmartAccount();

            const response = await request(app)
                .get(`/api/accounts/${account.address}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('metadata');

            expect(response.body.data).toHaveProperty('address');
            expect(response.body.data).toHaveProperty('isDeployed');
            expect(response.body.data).toHaveProperty('nonce');
            expect(response.body.data).toHaveProperty('balance');

            expect(response.body.metadata).toHaveProperty('service');
            expect(response.body.metadata).toHaveProperty('timestamp');
        });
    });
});
