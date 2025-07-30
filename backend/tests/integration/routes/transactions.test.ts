import request from 'supertest';
import {Express} from 'express';
import {createApp} from '../../../src/app';
import {ApiTestHelper, MockDataGenerator} from '../../utils/testHelpers';
import '../../mocks/viemMocks';

describe('Transaction Routes', () => {
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

    describe('POST /api/transactions/send', () => {
        beforeEach(async () => {
            await testHelper.authenticateUser('tx@test.com');
        });

        it('should send transaction with valid parameters', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000', // 0.1 ETH
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBeValidTransactionHash();
            expect(response.body.data.userOpHash).toBeValidTransactionHash();
            expect(response.body.data.success).toBe(true);
            expect(response.body.data.receipt.status).toBe('success');
            expect(response.body.metadata.service).toBe('simple-alchemy-client');
        });

        it('should send transaction with contract data', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '0',
                data: '0xa9059cbb00000000000000000000000074657374406e6578757377616c6c65742e636f6d0000000000000000000000000000000000000000000000000de0b6b3a7640000'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBeValidTransactionHash();
        });

        it('should send transaction with zero value', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '0',
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBeValidTransactionHash();
        });

        it('should send transaction with high value', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '1000000000000000000000', // 1000 ETH
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBeValidTransactionHash();
        });

        it('should fail without recipient address', async () => {
            const txData = {
                value: '100000000000000000',
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(400);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TO_ADDRESS');
            expect(response.body.error.message).toBe('Recipient address is required');
        });

        it('should fail when not authenticated', async () => {
            await testHelper.disconnectUser();

            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000',
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_AUTHENTICATED');
        });

        it('should handle missing optional parameters', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B'
                // No value or data specified
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBeValidTransactionHash();
        });

        it('should generate unique transaction hashes', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000',
                data: '0x'
            };

            const response1 = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            const response2 = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response1.body.data.hash).not.toBe(response2.body.data.hash);
            expect(response1.body.data.hash).toBeValidTransactionHash();
            expect(response2.body.data.hash).toBeValidTransactionHash();
        });

        it('should include userOpHash in response', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000',
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body.data.userOpHash).toBeDefined();
            expect(response.body.data.userOpHash).toBeValidTransactionHash();
            // In our mock, userOpHash equals hash
            expect(response.body.data.userOpHash).toBe(response.body.data.hash);
        });
    });

    describe('GET /api/transactions/:hash', () => {
        let transactionHash: string;

        beforeEach(async () => {
            await testHelper.authenticateUser('tx-status@test.com');
            const tx = await testHelper.sendTransaction('0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B');
            transactionHash = tx.hash;
        });

        it('should return transaction status for valid hash', async () => {
            const response = await request(app)
                .get(`/api/transactions/${transactionHash}`)
                .expect(200);

            expect(response.body).toBeValidApiResponse();
            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBe(transactionHash);
            expect(response.body.data.status).toBe('success');
            expect(response.body.data.blockNumber).toBe(12345);
            expect(response.body.data.gasUsed).toBe('21000');
            expect(response.body.data.timestamp).toBeGreaterThan(0);
        });

        it('should return status for any transaction hash', async () => {
            const randomHash = MockDataGenerator.generateTransactionHash();

            const response = await request(app)
                .get(`/api/transactions/${randomHash}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBe(randomHash);
            expect(response.body.data.status).toBe('success');
        });

        it('should handle invalid hash format gracefully', async () => {
            const invalidHash = 'invalid-hash';

            const response = await request(app)
                .get(`/api/transactions/${invalidHash}`)
                .expect(200);

            // Mock implementation returns success for any hash
            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBe(invalidHash);
        });

        it('should handle short hash', async () => {
            const shortHash = '0x1234';

            const response = await request(app)
                .get(`/api/transactions/${shortHash}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hash).toBe(shortHash);
        });

        it('should return consistent mock data', async () => {
            const response = await request(app)
                .get(`/api/transactions/${transactionHash}`)
                .expect(200);

            expect(response.body.data.blockNumber).toBe(12345);
            expect(response.body.data.gasUsed).toBe('21000');
            expect(response.body.data.status).toBe('success');
        });
    });

    describe('Transaction Flow', () => {
        beforeEach(async () => {
            await testHelper.authenticateUser('flow@test.com');
        });

        it('should complete send and status check flow', async () => {
            // 1. Send transaction
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000',
                data: '0x'
            };

            const sendResponse = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(sendResponse.body.success).toBe(true);
            const txHash = sendResponse.body.data.hash;
            expect(txHash).toBeValidTransactionHash();

            // 2. Check transaction status
            const statusResponse = await request(app)
                .get(`/api/transactions/${txHash}`)
                .expect(200);

            expect(statusResponse.body.success).toBe(true);
            expect(statusResponse.body.data.hash).toBe(txHash);
            expect(statusResponse.body.data.status).toBe('success');
        });

        it('should handle multiple transactions from same user', async () => {
            const transactions = [];
            const recipient = '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B';

            // Send multiple transactions
            for (let i = 0; i < 3; i++) {
                const txData = {
                    to: recipient,
                    value: `${(i + 1) * 100000000000000000}`, // Different values
                    data: '0x'
                };

                const response = await request(app)
                    .post('/api/transactions/send')
                    .send(txData)
                    .expect(200);

                transactions.push(response.body.data);
            }

            // Verify all transactions have unique hashes
            const hashes = transactions.map(tx => tx.hash);
            const uniqueHashes = [...new Set(hashes)];
            expect(uniqueHashes.length).toBe(3);

            // Check status of each transaction
            for (const tx of transactions) {
                const statusResponse = await request(app)
                    .get(`/api/transactions/${tx.hash}`)
                    .expect(200);

                expect(statusResponse.body.data.hash).toBe(tx.hash);
                expect(statusResponse.body.data.status).toBe('success');
            }
        });

        it('should handle transactions to different recipients', async () => {
            const recipients = [
                '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
            ];

            for (const recipient of recipients) {
                const txData = {
                    to: recipient,
                    value: '100000000000000000',
                    data: '0x'
                };

                const response = await request(app)
                    .post('/api/transactions/send')
                    .send(txData)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.hash).toBeValidTransactionHash();
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(async () => {
            await testHelper.authenticateUser('error@test.com');
        });

        it('should handle malformed transaction data', async () => {
            const malformedData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: 'not-a-number',
                data: 'invalid-hex'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(malformedData)
                .expect(200);

            // Mock implementation doesn't validate input format
            expect(response.body.success).toBe(true);
        });

        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/transactions/send')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TO_ADDRESS');
        });

        it('should handle missing route parameter', async () => {
            const response = await request(app)
                .get('/api/transactions/')
                .expect(404);

            // Express returns 404 for missing route parameters
        });
    });

    describe('Response Format Consistency', () => {
        beforeEach(async () => {
            await testHelper.authenticateUser('format@test.com');
        });

        it('should return consistent format for transaction send', async () => {
            const txData = {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000',
                data: '0x'
            };

            const response = await request(app)
                .post('/api/transactions/send')
                .send(txData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('metadata');

            expect(response.body.data).toHaveProperty('hash');
            expect(response.body.data).toHaveProperty('userOpHash');
            expect(response.body.data).toHaveProperty('success');
            expect(response.body.data).toHaveProperty('receipt');

            expect(response.body.metadata).toHaveProperty('service');
            expect(response.body.metadata).toHaveProperty('timestamp');
        });

        it('should return consistent format for transaction status', async () => {
            const txHash = MockDataGenerator.generateTransactionHash();

            const response = await request(app)
                .get(`/api/transactions/${txHash}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');

            expect(response.body.data).toHaveProperty('hash');
            expect(response.body.data).toHaveProperty('status');
            expect(response.body.data).toHaveProperty('blockNumber');
            expect(response.body.data).toHaveProperty('gasUsed');
            expect(response.body.data).toHaveProperty('timestamp');
        });

        it('should return consistent error format', async () => {
            const response = await request(app)
                .post('/api/transactions/send')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toHaveProperty('code');
            expect(response.body.error).toHaveProperty('message');
        });
    });
});
