import dotenv from 'dotenv';
import {TestDataCleaner} from './utils/testHelpers';

// Load test environment variables
dotenv.config({path: '.env.test'});

// Global test setup
beforeAll(() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3002'; // Different port for testing
    process.env.ALCHEMY_API_KEY = 'test_api_key';

    // Silence console.log during tests unless explicitly needed
    if (process.env.TEST_VERBOSE !== 'true') {
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    }
});

// Clean up between tests
beforeEach(() => {
    // Clear all test data to ensure test isolation
    TestDataCleaner.clearAllTestData();
});

// Global test teardown
afterAll(() => {
    // Final cleanup
    TestDataCleaner.clearAllTestData();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
