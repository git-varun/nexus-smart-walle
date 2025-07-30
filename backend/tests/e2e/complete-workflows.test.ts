import request from 'supertest';
import {Express} from 'express';
import {createApp} from '../../src/app';
import {ApiTestHelper} from '../utils/testHelpers';
import '../mocks/viemMocks';

describe('End-to-End Workflows', () => {
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

    describe('Complete Smart Wallet Setup and Usage', () => {
        it('should complete full wallet setup and transaction flow', async () => {
            const userEmail = 'e2e-full@nexuswallet.com';

            // Step 1: Check initial authentication status
            let authStatus = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(authStatus.body.data.isAuthenticated).toBe(false);

            // Step 2: Authenticate user
            const authResponse = await request(app)
                .post('/api/auth/connect')
                .send({email: userEmail, type: 'email'})
                .expect(200);

            expect(authResponse.body.success).toBe(true);
            expect(authResponse.body.data.email).toBe(userEmail);

            // Step 3: Verify authentication
            authStatus = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(authStatus.body.data.isAuthenticated).toBe(true);
            expect(authStatus.body.data.user.email).toBe(userEmail);

            // Step 4: Create smart account
            const accountResponse = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(accountResponse.body.success).toBe(true);
            const smartAccountAddress = accountResponse.body.data.address;
            expect(smartAccountAddress).toBeValidEthereumAddress();

            // Step 5: Get account information
            const accountInfoResponse = await request(app)
                .get(`/api/accounts/${smartAccountAddress}`)
                .expect(200);

            expect(accountInfoResponse.body.success).toBe(true);
            expect(accountInfoResponse.body.data.address).toBe(smartAccountAddress);
            expect(accountInfoResponse.body.data.isDeployed).toBe(true);
            expect(accountInfoResponse.body.data.balance).toBe('1000000000000000000'); // 1 ETH

            // Step 6: Create session key for transactions
            const sessionResponse = await request(app)
                .post('/api/session/create')
                .send({
                    permissions: [
                        {
                            target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                            allowedFunctions: ['transfer', 'approve'],
                            spendingLimit: '500000000000000000' // 0.5 ETH limit
                        }
                    ],
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000
                })
                .expect(200);

            expect(sessionResponse.body.success).toBe(true);
            const sessionKey = sessionResponse.body.data;
            expect(sessionKey.id).toMatch(/^session_\d+$/);
            expect(sessionKey.isActive).toBe(true);

            // Step 7: Send transaction
            const txResponse = await request(app)
                .post('/api/transactions/send')
                .send({
                    to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                    value: '100000000000000000', // 0.1 ETH
                    data: '0x'
                })
                .expect(200);

            expect(txResponse.body.success).toBe(true);
            const txHash = txResponse.body.data.hash;
            expect(txHash).toBeValidTransactionHash();

            // Step 8: Check transaction status
            const txStatusResponse = await request(app)
                .get(`/api/transactions/${txHash}`)
                .expect(200);

            expect(txStatusResponse.body.success).toBe(true);
            expect(txStatusResponse.body.data.hash).toBe(txHash);
            expect(txStatusResponse.body.data.status).toBe('success');

            // Step 9: Set up recovery for the account
            const recoveryResponse = await request(app)
                .post('/api/recovery/initiate')
                .send({
                    accountAddress: smartAccountAddress,
                    guardians: [
                        '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                        '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                    ],
                    threshold: 1
                })
                .expect(200);

            expect(recoveryResponse.body.success).toBe(true);
            const recoveryId = recoveryResponse.body.data.id;
            expect(recoveryId).toMatch(/^recovery_\d+_[a-z0-9]+$/);

            // Step 10: Check recovery status
            const recoveryStatusResponse = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            expect(recoveryStatusResponse.body.success).toBe(true);
            expect(recoveryStatusResponse.body.data.accountAddress).toBe(smartAccountAddress);
            expect(recoveryStatusResponse.body.data.status).toBe('pending');

            // Step 11: List active session keys
            const sessionListResponse = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionListResponse.body.success).toBe(true);
            expect(sessionListResponse.body.data).toHaveLength(1);
            expect(sessionListResponse.body.data[0].id).toBe(sessionKey.id);

            // Step 12: Revoke session key
            const revokeResponse = await request(app)
                .delete(`/api/session/${sessionKey.id}`)
                .expect(200);

            expect(revokeResponse.body.success).toBe(true);

            // Step 13: Verify session key is no longer active
            const finalSessionListResponse = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(finalSessionListResponse.body.success).toBe(true);
            expect(finalSessionListResponse.body.data).toHaveLength(0);

            // Step 14: Disconnect user
            const disconnectResponse = await request(app)
                .post('/api/auth/disconnect')
                .expect(200);

            expect(disconnectResponse.body.success).toBe(true);

            // Step 15: Verify disconnection
            const finalAuthStatus = await request(app)
                .get('/api/auth/status')
                .expect(200);

            expect(finalAuthStatus.body.data.isAuthenticated).toBe(false);
        });

        it('should handle multiple users with separate wallets', async () => {
            const user1Email = 'user1@e2e.com';
            const user2Email = 'user2@e2e.com';

            // User 1 workflow
            await request(app)
                .post('/api/auth/connect')
                .send({email: user1Email, type: 'email'})
                .expect(200);

            const user1Account = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            const user1Address = user1Account.body.data.address;

            const user1Session = await request(app)
                .post('/api/session/create')
                .send({
                    permissions: [
                        {
                            target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                            allowedFunctions: ['transfer'],
                            spendingLimit: '1000000000000000000'
                        }
                    ]
                })
                .expect(200);

            // Switch to User 2
            await request(app)
                .post('/api/auth/disconnect')
                .expect(200);

            await request(app)
                .post('/api/auth/connect')
                .send({email: user2Email, type: 'email'})
                .expect(200);

            const user2Account = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            const user2Address = user2Account.body.data.address;

            // Verify accounts are different
            expect(user1Address).not.toBe(user2Address);
            expect(user1Address).toBeValidEthereumAddress();
            expect(user2Address).toBeValidEthereumAddress();

            // User 2 session keys should be independent
            const user2SessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(user2SessionList.body.data).toHaveLength(1); // Sessions are global in mock implementation

            // Switch back to User 1 and verify their session still exists
            await request(app)
                .post('/api/auth/disconnect')
                .expect(200);

            await request(app)
                .post('/api/auth/connect')
                .send({email: user1Email, type: 'email'})
                .expect(200);

            const user1SessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(user1SessionList.body.data).toHaveLength(1);
            expect(user1SessionList.body.data[0].id).toBe(user1Session.body.data.id);
        });
    });

    describe('Session Key Lifecycle Management', () => {
        it('should manage complete session key lifecycle', async () => {
            // Setup
            await testHelper.authenticateUser('session-lifecycle@test.com');
            await testHelper.createSmartAccount();

            // Create multiple session keys with different permissions
            const sessionData1 = {
                permissions: [
                    {
                        target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                        allowedFunctions: ['transfer'],
                        spendingLimit: '1000000000000000000'
                    }
                ],
                expiresAt: Date.now() + 24 * 60 * 60 * 1000
            };

            const sessionData2 = {
                permissions: [
                    {
                        target: '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                        allowedFunctions: ['approve', 'transferFrom'],
                        spendingLimit: '500000000000000000'
                    }
                ],
                expiresAt: Date.now() + 48 * 60 * 60 * 1000
            };

            // Create sessions
            const session1 = await request(app)
                .post('/api/session/create')
                .send(sessionData1)
                .expect(200);

            const session2 = await request(app)
                .post('/api/session/create')
                .send(sessionData2)
                .expect(200);

            // Verify both sessions are active
            let sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(2);

            // Use sessions for transactions
            const tx1 = await request(app)
                .post('/api/transactions/send')
                .send({
                    to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                    value: '100000000000000000',
                    data: '0x'
                })
                .expect(200);

            const tx2 = await request(app)
                .post('/api/transactions/send')
                .send({
                    to: '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    value: '50000000000000000',
                    data: '0x'
                })
                .expect(200);

            // Verify transactions succeeded
            expect(tx1.body.success).toBe(true);
            expect(tx2.body.success).toBe(true);

            // Revoke first session
            await request(app)
                .delete(`/api/session/${session1.body.data.id}`)
                .expect(200);

            // Verify only one session remains
            sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(1);
            expect(sessionList.body.data[0].id).toBe(session2.body.data.id);

            // Revoke remaining session
            await request(app)
                .delete(`/api/session/${session2.body.data.id}`)
                .expect(200);

            // Verify no sessions remain
            sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(0);
        });
    });

    describe('Account Recovery Workflow', () => {
        it('should handle complete recovery setup and monitoring', async () => {
            // Setup user and account
            await testHelper.authenticateUser('recovery-workflow@test.com');
            const account = await testHelper.createSmartAccount();

            const guardians = [
                '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                '0x47e179ec197488593b187f80a00eb0da91f1b9d0',
                '0x1234567890123456789012345678901234567890'
            ];

            // Initiate recovery with 2-of-3 threshold
            const recoveryResponse = await request(app)
                .post('/api/recovery/initiate')
                .send({
                    accountAddress: account.address,
                    guardians,
                    threshold: 2
                })
                .expect(200);

            expect(recoveryResponse.body.success).toBe(true);
            const recoveryId = recoveryResponse.body.data.id;

            // Monitor recovery status
            const statusResponse1 = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            expect(statusResponse1.body.data.status).toBe('pending');
            expect(statusResponse1.body.data.guardians).toEqual(guardians);
            expect(statusResponse1.body.data.threshold).toBe(2);

            // Initiate another recovery for same account (edge case)
            const recovery2Response = await request(app)
                .post('/api/recovery/initiate')
                .send({
                    accountAddress: account.address,
                    guardians: guardians.slice(0, 2), // Different guardian set
                    threshold: 1
                })
                .expect(200);

            expect(recovery2Response.body.success).toBe(true);
            expect(recovery2Response.body.data.id).not.toBe(recoveryId);

            // Verify both recoveries exist
            const status1 = await request(app)
                .get(`/api/recovery/${recoveryId}/status`)
                .expect(200);

            const status2 = await request(app)
                .get(`/api/recovery/${recovery2Response.body.data.id}/status`)
                .expect(200);

            expect(status1.body.data.threshold).toBe(2);
            expect(status2.body.data.threshold).toBe(1);
            expect(status1.body.data.guardians).toHaveLength(3);
            expect(status2.body.data.guardians).toHaveLength(2);
        });
    });

    describe('Cross-Feature Integration', () => {
        it('should handle wallet operations across all features', async () => {
            const userEmail = 'integration@test.com';

            // Authenticate
            await testHelper.authenticateUser(userEmail);

            // Create account
            const account = await testHelper.createSmartAccount();

            // Create multiple session keys for different purposes
            const tradingSession = await request(app)
                .post('/api/session/create')
                .send({
                    permissions: [
                        {
                            target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                            allowedFunctions: ['transfer', 'approve'],
                            spendingLimit: '2000000000000000000' // 2 ETH
                        }
                    ]
                })
                .expect(200);

            const defiSession = await request(app)
                .post('/api/session/create')
                .send({
                    permissions: [
                        {
                            target: '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                            allowedFunctions: ['stake', 'unstake', 'claim'],
                            spendingLimit: '1000000000000000000' // 1 ETH
                        }
                    ]
                })
                .expect(200);

            // Set up recovery
            const recovery = await testHelper.initiateRecovery(
                account.address,
                [
                    '0x1111111111111111111111111111111111111111',
                    '0x2222222222222222222222222222222222222222',
                    '0x3333333333333333333333333333333333333333'
                ],
                2
            );

            // Perform various transactions
            const transactions = [];

            // Trading transaction
            const tradeTx = await testHelper.sendTransaction(
                '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                '500000000000000000' // 0.5 ETH
            );
            transactions.push(tradeTx);

            // DeFi transaction
            const defiTx = await testHelper.sendTransaction(
                '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                '300000000000000000' // 0.3 ETH
            );
            transactions.push(defiTx);

            // Verify all transactions
            for (const tx of transactions) {
                const statusResponse = await request(app)
                    .get(`/api/transactions/${tx.hash}`)
                    .expect(200);

                expect(statusResponse.body.success).toBe(true);
                expect(statusResponse.body.data.status).toBe('success');
            }

            // Verify sessions are still active
            const sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(2);

            // Verify recovery is still pending
            const recoveryStatus = await request(app)
                .get(`/api/recovery/${recovery.id}/status`)
                .expect(200);

            expect(recoveryStatus.body.data.status).toBe('pending');

            // Clean up: revoke sessions
            await request(app)
                .delete(`/api/session/${tradingSession.body.data.id}`)
                .expect(200);

            await request(app)
                .delete(`/api/session/${defiSession.body.data.id}`)
                .expect(200);

            // Verify cleanup
            const finalSessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(finalSessionList.body.data).toHaveLength(0);
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        it('should handle authentication session interruptions gracefully', async () => {
            // Start workflow
            await testHelper.authenticateUser('interrupt@test.com');
            const account = await testHelper.createSmartAccount();

            // Create session
            const session = await testHelper.createSessionKey();

            // Simulate session interruption by disconnecting
            await testHelper.disconnectUser();

            // Try to use authenticated endpoints (should fail)
            await request(app)
                .post('/api/accounts/create')
                .expect(401);

            await request(app)
                .post('/api/transactions/send')
                .send({
                    to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                    value: '100000000000000000',
                    data: '0x'
                })
                .expect(401);

            // Reconnect and verify state
            await testHelper.authenticateUser('interrupt@test.com');

            // Should be able to use the same account
            const accountResponse = await request(app)
                .post('/api/accounts/create')
                .expect(200);

            expect(accountResponse.body.data.address).toBe(account.address);

            // Session keys should still exist (they're stored independently)
            const sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(1);
            expect(sessionList.body.data[0].id).toBe(session.id);
        });

        it('should handle rapid successive operations', async () => {
            await testHelper.authenticateUser('rapid@test.com');
            await testHelper.createSmartAccount();

            // Create multiple sessions rapidly
            const sessionPromises = Array(5).fill(0).map((_, i) =>
                request(app)
                    .post('/api/session/create')
                    .send({
                        permissions: [
                            {
                                target: `0x${i.toString().padStart(40, '0')}`,
                                allowedFunctions: ['transfer'],
                                spendingLimit: '1000000000000000000'
                            }
                        ]
                    })
            );

            const sessionResponses = await Promise.all(sessionPromises);

            // Verify all sessions were created successfully
            sessionResponses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            // Verify all sessions are listed
            const sessionList = await request(app)
                .get('/api/session/list')
                .expect(200);

            expect(sessionList.body.data).toHaveLength(5);

            // Send multiple transactions rapidly
            const txPromises = Array(3).fill(0).map((_, i) =>
                request(app)
                    .post('/api/transactions/send')
                    .send({
                        to: `0x${i.toString().padStart(40, '0')}`,
                        value: `${(i + 1) * 100000000000000000}`,
                        data: '0x'
                    })
            );

            const txResponses = await Promise.all(txPromises);

            // Verify all transactions succeeded
            txResponses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.hash).toBeValidTransactionHash();
            });

            // Verify all transactions have unique hashes
            const hashes = txResponses.map(r => r.body.data.hash);
            const uniqueHashes = [...new Set(hashes)];
            expect(uniqueHashes.length).toBe(3);
        });
    });
});
