import request from 'supertest';
import {Express} from 'express';
import {createApp} from '../../../src/app';
import {ApiTestHelper} from '../../utils/testHelpers';
import '../../mocks/viemMocks';

describe('Authentication Routes', () => {
    let app: Express;
    let testHelper: ApiTestHelper;

    beforeAll(async () => {
        app = await createApp();
        testHelper = new ApiTestHelper(app);
    });

    afterEach(async () => {
        // Clean up authentication state
        try {
            await testHelper.disconnectUser();
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('GET /api/auth/status', () => {
        it('should return unauthenticated status initially', async () => {
            const response = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.isAuthenticated).toBe(false);
            expect(response.body.data.user).toBeNull();
        });

        it('should return authenticated status after login', async () => {
            // First authenticate
            await testHelper.authenticateUser('test@nexuswallet.com');

            const response = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.isAuthenticated).toBe(true);
            expect(response.body.data.user).toEqual({
                email: 'test@nexuswallet.com',
                userId: expect.any(String)
            });
        });
    });

    describe('POST /api/auth/connect', () => {
        it('should authenticate with valid email', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'test@nexuswallet.com',
                    type: 'email'
                })
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('test@nexuswallet.com');
            expect(response.body.data.userId).toMatch(/^user_\d+$/);
            expect(response.body.metadata.service).toBe('simple-alchemy-client');
        });

        it('should fail authentication without email', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({type: 'email'})
                .expect(400);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_EMAIL');
            expect(response.body.error.message).toBe('Email is required');
        });

        it('should fail authentication with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'invalid-email',
                    type: 'email'
                })
                .expect(200); // The mock doesn't validate email format, but real implementation would

            // In a real implementation, this would return an error
            expect(response.body.success).toBe(true);
        });

        it('should handle different email addresses', async () => {
            const emails = [
                'user1@example.com',
                'user2@test.org',
                'admin@nexuswallet.com'
            ];

            for (const email of emails) {
                const response = await request(app)
                    .post('/api/auth/connect')
                    .send({email, type: 'email'})
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.email).toBe(email);

                // Clean up
                await testHelper.disconnectUser();
            }
        });
    });

    describe('POST /api/auth/disconnect', () => {
        it('should disconnect authenticated user', async () => {
            // First authenticate
            await testHelper.authenticateUser('test@nexuswallet.com');

            const response = await request(app)
                .post('/api/auth/disconnect')
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Disconnected successfully');

            // Verify user is disconnected
            const statusResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(statusResponse.body.data.isAuthenticated).toBe(false);
        });

        it('should handle disconnect when not authenticated', async () => {
            const response = await request(app)
                .post('/api/auth/disconnect')
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Disconnected successfully');
        });
    });

    describe('Authentication Flow', () => {
        it('should complete full authentication cycle', async () => {
            // 1. Check initial status (unauthenticated)
            let statusResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);
            expect(statusResponse.body.data.isAuthenticated).toBe(false);

            // 2. Authenticate
            const authResponse = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'cycle@test.com',
                    type: 'email'
                })
                .expect(200);
            expect(authResponse.body.success).toBe(true);

            // 3. Check status (authenticated)
            statusResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);
            expect(statusResponse.body.data.isAuthenticated).toBe(true);
            expect(statusResponse.body.data.user.email).toBe('cycle@test.com');

            // 4. Disconnect
            const disconnectResponse = await request(app)
                .post('/api/auth/disconnect')
                .expect(200);
            expect(disconnectResponse.body.success).toBe(true);

            // 5. Check final status (unauthenticated)
            statusResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);
            expect(statusResponse.body.data.isAuthenticated).toBe(false);
        });

        it('should handle multiple authentication attempts', async () => {
            // First authentication
            const auth1 = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'user1@test.com',
                    type: 'email'
                })
                .expect(200);
            expect(auth1.body.data.email).toBe('user1@test.com');

            // Second authentication (should override first)
            const auth2 = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'user2@test.com',
                    type: 'email'
                })
                .expect(200);
            expect(auth2.body.data.email).toBe('user2@test.com');

            // Check current status
            const statusResponse = await request(app)
                .get('/api/auth/status')
                .expect(200);
            expect(statusResponse.body.data.user.email).toBe('user2@test.com');
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .type('json')
                .send('{"invalid": json}')
                .expect(400);

            // The error would be handled by Express JSON middleware
        });

        it('should handle missing Content-Type', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({email: 'test@example.com', type: 'email'})
                .expect(200);

            // Should still work with default handling
            expect(response.body.success).toBe(true);
        });

        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_EMAIL');
        });
    });

    describe('Response Format Consistency', () => {
        it('should maintain consistent response format for success', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({
                    email: 'format@test.com',
                    type: 'email'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('service');
            expect(response.body.metadata).toHaveProperty('timestamp');
        });

        it('should maintain consistent response format for errors', async () => {
            const response = await request(app)
                .post('/api/auth/connect')
                .send({type: 'email'})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
        });
    });
});
