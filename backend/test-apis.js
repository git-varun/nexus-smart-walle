const axios = require('axios');
const {createPublicClient, http} = require('viem');
const {baseSepolia} = require('viem/chains');

const API_BASE = 'http://localhost:3001/api';

// Initialize Alchemy service manually for testing
async function initializeAlchemyService() {
    console.log('🔧 Initializing Alchemy service for testing...');

    // This would normally be done in the backend startup
    const {AlchemyService} = require('./src/services/AlchemyService');

    const config = {
        apiKey: process.env.ALCHEMY_API_KEY || 'I3POjlK37a4nA5GFoVdufRMKa5hbnxTd',
        chainId: 84532, // Base Sepolia
        enableGasManager: true,
        policyId: process.env.ALCHEMY_POLICY_ID || null
    };

    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(`https://base-sepolia.g.alchemy.com/v2/${config.apiKey}`)
    });

    const service = AlchemyService.getInstance(config);
    service.initialize(publicClient);

    console.log('✅ Alchemy service initialized');
    return service;
}

async function testAllAPIs() {
    console.log('🧪 Starting comprehensive API testing...\n');

    let testResults = {
        auth: {},
        accounts: {},
        transactions: {},
        sessions: {},
        recovery: {},
        errors: []
    };

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Health Endpoint...');
        const healthResponse = await axios.get(`${API_BASE.replace('/api', '')}/health`);
        console.log('✅ Health check:', healthResponse.data);

        // Test 2: Authentication Status (Before login)
        console.log('\n2️⃣ Testing Auth Status (Before login)...');
        const authStatusBefore = await axios.get(`${API_BASE}/auth/status`);
        console.log('✅ Auth status before:', authStatusBefore.data);
        testResults.auth.statusBefore = authStatusBefore.data;

        // Test 3: Authentication Connect
        console.log('\n3️⃣ Testing Authentication Connect...');
        try {
            const authConnect = await axios.post(`${API_BASE}/auth/connect`, {
                email: 'test@nexuswallet.com',
                type: 'email'
            });
            console.log('✅ Auth connect:', authConnect.data);
            testResults.auth.connect = authConnect.data;
        } catch (error) {
            console.log('❌ Auth connect failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'auth/connect',
                error: error.response?.data || error.message
            });
        }

        // Test 4: Authentication Status (After login attempt)
        console.log('\n4️⃣ Testing Auth Status (After login attempt)...');
        const authStatusAfter = await axios.get(`${API_BASE}/auth/status`);
        console.log('✅ Auth status after:', authStatusAfter.data);
        testResults.auth.statusAfter = authStatusAfter.data;

        // Test 5: Smart Account Creation
        console.log('\n5️⃣ Testing Smart Account Creation...');
        try {
            const accountCreate = await axios.post(`${API_BASE}/accounts/create`);
            console.log('✅ Account creation:', accountCreate.data);
            testResults.accounts.create = accountCreate.data;
        } catch (error) {
            console.log('❌ Account creation failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'accounts/create',
                error: error.response?.data || error.message
            });
        }

        // Test 6: Get Account Info
        console.log('\n6️⃣ Testing Get Account Info...');
        try {
            const testAddress = '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B';
            const accountInfo = await axios.get(`${API_BASE}/accounts/${testAddress}`);
            console.log('✅ Account info:', accountInfo.data);
            testResults.accounts.info = accountInfo.data;
        } catch (error) {
            console.log('❌ Account info failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'accounts/info',
                error: error.response?.data || error.message
            });
        }

        // Test 7: Session Key Creation
        console.log('\n7️⃣ Testing Session Key Creation...');
        try {
            const sessionCreate = await axios.post(`${API_BASE}/session/create`, {
                permissions: [
                    {
                        target: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                        allowedFunctions: ['transfer'],
                        spendingLimit: '1000000000000000000' // 1 ETH
                    }
                ],
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            });
            console.log('✅ Session key creation:', sessionCreate.data);
            testResults.sessions.create = sessionCreate.data;
        } catch (error) {
            console.log('❌ Session key creation failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'session/create',
                error: error.response?.data || error.message
            });
        }

        // Test 8: List Session Keys
        console.log('\n8️⃣ Testing List Session Keys...');
        try {
            const sessionList = await axios.get(`${API_BASE}/session/list`);
            console.log('✅ Session key list:', sessionList.data);
            testResults.sessions.list = sessionList.data;
        } catch (error) {
            console.log('❌ Session key list failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'session/list',
                error: error.response?.data || error.message
            });
        }

        // Test 9: Send Transaction
        console.log('\n9️⃣ Testing Send Transaction...');
        try {
            const transactionSend = await axios.post(`${API_BASE}/transactions/send`, {
                to: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                value: '100000000000000000', // 0.1 ETH
                data: '0x'
            });
            console.log('✅ Transaction send:', transactionSend.data);
            testResults.transactions.send = transactionSend.data;

            // Test 10: Get Transaction Status
            if (transactionSend.data.success && transactionSend.data.data.hash) {
                console.log('\n🔟 Testing Get Transaction Status...');
                const txHash = transactionSend.data.data.hash;
                const transactionStatus = await axios.get(`${API_BASE}/transactions/${txHash}`);
                console.log('✅ Transaction status:', transactionStatus.data);
                testResults.transactions.status = transactionStatus.data;
            }
        } catch (error) {
            console.log('❌ Transaction send failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'transactions/send',
                error: error.response?.data || error.message
            });
        }

        // Test 11: Recovery Initiation
        console.log('\n1️⃣1️⃣ Testing Recovery Initiation...');
        try {
            const recoveryInitiate = await axios.post(`${API_BASE}/recovery/initiate`, {
                accountAddress: '0x742d35cc6601c91F3B31adFa85e13b7c8F81B28B',
                guardians: [
                    '0x8ba1f109551bD432803012645Hac136c5d96Ee69',
                    '0x47e179ec197488593b187f80a00eb0da91f1b9d0'
                ],
                threshold: 1
            });
            console.log('✅ Recovery initiation:', recoveryInitiate.data);
            testResults.recovery.initiate = recoveryInitiate.data;

            // Test 12: Recovery Status
            if (recoveryInitiate.data.success && recoveryInitiate.data.data.id) {
                console.log('\n1️⃣2️⃣ Testing Recovery Status...');
                const recoveryId = recoveryInitiate.data.data.id;
                const recoveryStatus = await axios.get(`${API_BASE}/recovery/${recoveryId}/status`);
                console.log('✅ Recovery status:', recoveryStatus.data);
                testResults.recovery.status = recoveryStatus.data;
            }
        } catch (error) {
            console.log('❌ Recovery initiation failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'recovery/initiate',
                error: error.response?.data || error.message
            });
        }

        // Test 13: Session Key Revocation
        if (testResults.sessions.create && testResults.sessions.create.success) {
            console.log('\n1️⃣3️⃣ Testing Session Key Revocation...');
            try {
                const sessionId = testResults.sessions.create.data.id;
                const sessionRevoke = await axios.delete(`${API_BASE}/session/${sessionId}`);
                console.log('✅ Session key revocation:', sessionRevoke.data);
                testResults.sessions.revoke = sessionRevoke.data;
            } catch (error) {
                console.log('❌ Session key revocation failed:', error.response?.data || error.message);
                testResults.errors.push({
                    test: 'session/revoke',
                    error: error.response?.data || error.message
                });
            }
        }

        // Test 14: Disconnect Authentication
        console.log('\n1️⃣4️⃣ Testing Authentication Disconnect...');
        try {
            const authDisconnect = await axios.post(`${API_BASE}/auth/disconnect`);
            console.log('✅ Auth disconnect:', authDisconnect.data);
            testResults.auth.disconnect = authDisconnect.data;
        } catch (error) {
            console.log('❌ Auth disconnect failed:', error.response?.data || error.message);
            testResults.errors.push({
                test: 'auth/disconnect',
                error: error.response?.data || error.message
            });
        }

    } catch (error) {
        console.error('❌ Critical error during testing:', error.message);
        testResults.errors.push({
            test: 'critical',
            error: error.message
        });
    }

    // Generate Test Report
    console.log('\n📊 TEST REPORT');
    console.log('================');

    console.log('\n🔐 Authentication Tests:');
    console.log(`- Status Check (Before): ${testResults.auth.statusBefore ? '✅' : '❌'}`);
    console.log(`- Connect: ${testResults.auth.connect ? '✅' : '❌'}`);
    console.log(`- Status Check (After): ${testResults.auth.statusAfter ? '✅' : '❌'}`);
    console.log(`- Disconnect: ${testResults.auth.disconnect ? '✅' : '❌'}`);

    console.log('\n👤 Account Tests:');
    console.log(`- Create Account: ${testResults.accounts.create ? '✅' : '❌'}`);
    console.log(`- Get Account Info: ${testResults.accounts.info ? '✅' : '❌'}`);

    console.log('\n💸 Transaction Tests:');
    console.log(`- Send Transaction: ${testResults.transactions.send ? '✅' : '❌'}`);
    console.log(`- Get Transaction Status: ${testResults.transactions.status ? '✅' : '❌'}`);

    console.log('\n🔑 Session Key Tests:');
    console.log(`- Create Session Key: ${testResults.sessions.create ? '✅' : '❌'}`);
    console.log(`- List Session Keys: ${testResults.sessions.list ? '✅' : '❌'}`);
    console.log(`- Revoke Session Key: ${testResults.sessions.revoke ? '✅' : '❌'}`);

    console.log('\n🛡️ Recovery Tests:');
    console.log(`- Initiate Recovery: ${testResults.recovery.initiate ? '✅' : '❌'}`);
    console.log(`- Check Recovery Status: ${testResults.recovery.status ? '✅' : '❌'}`);

    if (testResults.errors.length > 0) {
        console.log('\n❌ Errors Found:');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.test}: ${JSON.stringify(error.error, null, 2)}`);
        });
    }

    console.log('\n✨ Testing completed!');

    return testResults;
}

// Run tests if script is executed directly
if (require.main === module) {
    testAllAPIs().catch(console.error);
}

module.exports = {testAllAPIs};
