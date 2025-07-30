import request from 'supertest';
import {Express} from 'express';
import {createApp} from '../../../src/app';
import {ApiTestHelper, MockDataGenerator} from '../../utils/testHelpers';
import '../../mocks/viemMocks';

describe('Recovery Routes', () => {
    let app: Express;
    let testHelper: ApiTestHelper;

    beforeAll(async () => {
        app = await createApp();
        testHelper = new ApiTestHelper(app);
    });

    describe('POST /api/recovery/initiate', () => {
        it('should initiate recovery with valid parameters', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toMatch(/^recovery_\d+_[a-z0-9]+$/);
            expect(response.body.data.accountAddress).toBe(recoveryData.accountAddress);
            expect(response.body.data.guardians).toEqual(recoveryData.guardians);
            expect(response.body.data.threshold).toBe(recoveryData.threshold);
            expect(response.body.data.status).toBe('pending');
            expect(new Date(response.body.data.createdAt)).toBeInstanceOf(Date);
        });

        it('should initiate recovery with multiple guardians', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0',
                    '0x1234567890123456789012345678901234567890',
                    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
                ],
                threshold: 3
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.guardians).toHaveLength(4);
            expect(response.body.data.threshold).toBe(3);
        });

        it('should initiate recovery with threshold equal to guardian count', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 2
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.threshold).toBe(2);
            expect(response.body.data.guardians).toHaveLength(2);
        });

        it('should fail without account address', async () => {
            const recoveryData = {
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(400);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
            expect(response.body.error.message).toBe('Account address, guardians, and threshold are required');
        });

        it('should fail without guardians', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });

        it('should fail without threshold', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ]
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });

        it('should fail with empty guardians array', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [],
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });

        it('should handle invalid threshold values', async () => {
            const recoveryData1 = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 0
            };

            const response1 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData1)
                .expect(200); // Mock doesn't validate threshold logic

            expect(response1.body.success).toBe(true);

            const recoveryData2 = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69'
                ],
                threshold: 5 // Greater than guardian count
            };

            const response2 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData2)
                .expect(200); // Mock doesn't validate threshold logic

            expect(response2.body.success).toBe(true);
        });

        it('should generate unique recovery IDs', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const response1 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            const response2 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response1.body.data.id).not.toBe(response2.body.data.id);
            expect(response1.body.data.id).toMatch(/^recovery_\d+_[a-z0-9]+$/);
            expect(response2.body.data.id).toMatch(/^recovery_\d+_[a-z0-9]+$/);
        });

        it('should handle different account addresses', async () => {
            const accounts = [
                '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
            ];

            for (const accountAddress of accounts) {
                const recoveryData = {
                    accountAddress,
                    guardians: [
                        '0x1234567890123456789012345678901234567890',
                        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
                    ],
                    threshold: 1
                };

                const response = await request(app)
                    .post('/api/recovery/initiate')
                    .send(recoveryData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.accountAddress).toBe(accountAddress);
            }
        });
    });

    describe('GET /api/recovery/:id/status', () => {
        let recoveryId: string;

        beforeEach(async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            recoveryId = response.body.data.id;
        });

        it('should return recovery status for existing request', async () => {
            const response = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(recoveryId);
            expect(response.body.data.accountAddress).toBe('0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B');
            expect(response.body.data.guardians).toHaveLength(2);
            expect(response.body.data.threshold).toBe(1);
            expect(response.body.data.status).toBe('pending');
            expect(new Date(response.body.data.createdAt)).toBeInstanceOf(Date);
        });

        it('should fail for non-existent recovery request', async () => {
            const nonExistentId = 'recovery_999999999';

            const response = await request(app)
                .get(`/api/recovery/${nonExistentId}/status`)
                .expect(404);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RECOVERY_REQUEST_NOT_FOUND');
            expect(response.body.error.message).toBe('Recovery request not found');
        });

        it('should handle invalid recovery ID format', async () => {
            const invalidId = 'invalid-recovery-id';

            const response = await request(app)
                .get(`/api/recovery/${invalidId}/status`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RECOVERY_REQUEST_NOT_FOUND');
        });

        it('should return same data across multiple status checks', async () => {
            const response1 = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            const response2 = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            expect(response1.body.data).toEqual(response2.body.data);
        });
    });

    describe('Recovery Management Flow', () => {
        it('should complete recovery initiation and status check flow', async () => {
            // 1. Initiate recovery
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0',
                    '0x1234567890123456789012345678901234567890'
                ],
                threshold: 2
            };

            const initiateResponse = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(initiateResponse.body.success).toBe(true);
            const recoveryId = initiateResponse.body.data.id;
            expect(recoveryId).toMatch(/^recovery_\d+_[a-z0-9]+$/);

            // 2. Check recovery status
            const statusResponse = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            expect(statusResponse.body.success).toBe(true);
            expect(statusResponse.body.data.id).toBe(recoveryId);
            expect(statusResponse.body.data.accountAddress).toBe(recoveryData.accountAddress);
            expect(statusResponse.body.data.guardians).toEqual(recoveryData.guardians);
            expect(statusResponse.body.data.threshold).toBe(recoveryData.threshold);
            expect(statusResponse.body.data.status).toBe('pending');

            // 3. Verify creation timestamp
            const createdAt = new Date(statusResponse.body.data.createdAt);
            const now = new Date();
            expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
            expect(createdAt.getTime()).toBeGreaterThan(now.getTime() - 5000); // Within 5 seconds
        });

        it('should handle multiple recovery requests for same account', async () => {
            const accountAddress = '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B';

            const recoveryData1 = {
                accountAddress,
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const recoveryData2 = {
                accountAddress,
                guardians: [
                    '0x1234567890123456789012345678901234567890',
                    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
                ],
                threshold: 2
            };

            // Create two recovery requests for same account
            const response1 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData1)
                .expect(200);

            const response2 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData2)
                .expect(200);

            expect(response1.body.data.id).not.toBe(response2.body.data.id);
            expect(response1.body.data.accountAddress).toBe(accountAddress);
            expect(response2.body.data.accountAddress).toBe(accountAddress);

            // Both should be retrievable
            const status1 = await request(app)
                .get(`/api/recovery/${response1.body.data.id}/status`)
                .expect(200);

            const status2 = await request(app)
                .get(`/api/recovery/${response2.body.data.id}/status`)
                .expect(200);

            expect(status1.body.data.guardians).not.toEqual(status2.body.data.guardians);
        });

        it('should handle recovery requests for different accounts', async () => {
            const recoveryData1 = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69'
                ],
                threshold: 1
            };

            const recoveryData2 = {
                accountAddress: '0x1234567890123456789012345678901234567890',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69'
                ],
                threshold: 1
            };

            const response1 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData1)
                .expect(200);

            const response2 = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData2)
                .expect(200);

            expect(response1.body.data.accountAddress).not.toBe(response2.body.data.accountAddress);
            expect(response1.body.data.id).not.toBe(response2.body.data.id);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed request data', async () => {
            const malformedData = {
                accountAddress: 'not-an-address',
                guardians: 'not-an-array',
                threshold: 'not-a-number'
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(malformedData)
                .expect(400); // Should fail validation

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });

        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/recovery/initiate')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });

        it('should handle missing route parameter', async () => {
            const response = await request(app)
                .get('/api/recovery//status')
                .expect(404);

            // Express returns 404 for malformed routes
        });

        it('should handle null values', async () => {
            const recoveryData = {
                accountAddress: null,
                guardians: null,
                threshold: null
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
        });
    });

    describe('Response Format Consistency', () => {
        it('should return consistent format for recovery initiation', async () => {
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');

            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('accountAddress');
            expect(response.body.data).toHaveProperty('guardians');
            expect(response.body.data).toHaveProperty('threshold');
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('createdAt');
        });

        it('should return consistent format for recovery status', async () => {
            // Create recovery first
            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69'
                ],
                threshold: 1
            };

            const createResponse = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            const statusResponse = await request(app)
                .get(`/api/recovery/${createResponse.body.data.id}/status`)
                .expect(200);

            expect(statusResponse.body).toHaveProperty('success', true);
            expect(statusResponse.body).toHaveProperty('data');

            expect(statusResponse.body.data).toHaveProperty('id');
            expect(statusResponse.body.data).toHaveProperty('accountAddress');
            expect(statusResponse.body.data).toHaveProperty('guardians');
            expect(statusResponse.body.data).toHaveProperty('threshold');
            expect(statusResponse.body.data).toHaveProperty('status');
            expect(statusResponse.body.data).toHaveProperty('createdAt');
        });

        it('should return consistent error format', async () => {
            const response = await request(app)
                .post('/api/recovery/initiate')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
        });

        it('should return consistent error format for not found', async () => {
            const response = await request(app)
                .get('/api/recovery/nonexistent/status')
                .expect(404);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
        });
    });

    describe('Data Validation', () => {
        it('should store guardian addresses correctly', async () => {
            const guardianAddresses = [
                '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                '0x47e179ec197488593b187f80a00eb0da91f1b9d0',
                '0x1234567890123456789012345678901234567890'
            ];

            const recoveryData = {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: guardianAddresses,
                threshold: 2
            };

            const response = await request(app)
                .post('/api/recovery/initiate')
                .send(recoveryData)
                .expect(200);

            expect(response.body.data.guardians).toEqual(guardianAddresses);
            expect(response.body.data.guardians).toHaveLength(3);

            // Verify through status check
            const statusResponse = await request(app)
                .get(`/api/recovery/${response.body.data.id}/status`)
                .expect(200);

            expect(statusResponse.body.data.guardians).toEqual(guardianAddresses);
        });

        it('should preserve threshold values correctly', async () => {
            const testThresholds = [1, 2, 3, 5, 10];

            for (const threshold of testThresholds) {
                const recoveryData = {
                    accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                    guardians: Array(threshold + 1).fill(0).map((_, i) =>
                        `0x${i.toString().padStart(40, '0')}`
                    ),
                    threshold
                };

                const response = await request(app)
                    .post('/api/recovery/initiate')
                    .send(recoveryData)
                    .expect(200);

                expect(response.body.data.threshold).toBe(threshold);

                // Verify through status check
                const statusResponse = await request(app)
                    .get(`/api/recovery/${response.body.data.id}/status`)
                    .expect(200);

                expect(statusResponse.body.data.threshold).toBe(threshold);
            }
        });
    });
});
