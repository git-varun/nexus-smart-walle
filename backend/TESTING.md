# Testing Guide for Nexus Smart Wallet Backend

This document provides comprehensive information about the testing infrastructure for the Nexus Smart Wallet backend.

## Overview

The test suite is built using Jest and provides:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete workflow testing
- **Error Handling Tests**: Edge cases and error scenarios
- **Coverage Reporting**: Code coverage analysis

## Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── services/                  # Service layer tests
│   │   └── AlchemyService.test.ts
│   └── providers/                 # Provider layer tests
│       └── SimpleAlchemyClient.test.ts
├── integration/                   # Integration tests
│   ├── routes/                    # API route tests
│   │   ├── auth.test.ts
│   │   ├── accounts.test.ts
│   │   ├── transactions.test.ts
│   │   ├── session.test.ts
│   │   └── recovery.test.ts
│   └── error-handling.test.ts     # Error scenarios
├── e2e/                          # End-to-end tests
│   └── complete-workflows.test.ts
├── utils/                        # Test utilities
│   └── testHelpers.ts            # Helper functions
├── mocks/                        # Mock implementations
│   ├── viemMocks.ts             # Viem library mocks
│   └── alchemyMocks.ts          # Alchemy client mocks
└── setup.ts                     # Test setup configuration
```

## Available Test Scripts

### Basic Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:ci           # Run tests for CI/CD
```

### Specific Test Categories

```bash
# Unit tests only
npx jest tests/unit

# Integration tests only
npx jest tests/integration

# End-to-end tests only
npx jest tests/e2e

# Specific test file
npx jest tests/unit/services/AlchemyService.test.ts
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Coverage**:

- `AlchemyService`: Singleton pattern, configuration, client management
- `SimpleAlchemyClient`: Authentication, transactions, account management

**Example**:

```typescript
describe('AlchemyService', () => {
  it('should create a singleton instance', () => {
    const instance1 = AlchemyService.getInstance(mockConfig);
    const instance2 = AlchemyService.getInstance();
    expect(instance1).toBe(instance2);
  });
});
```

### 2. Integration Tests

**Purpose**: Test API endpoints with real HTTP requests

**Coverage**:

- Authentication flow (connect/disconnect/status)
- Account management (create/retrieve)
- Transaction handling (send/status)
- Session key management (create/list/revoke)
- Recovery process (initiate/status)

**Example**:

```typescript
describe('Authentication Routes', () => {
  it('should authenticate with valid email', async () => {
    const response = await request(app)
      .post('/api/auth/connect')
      .send({ email: 'test@example.com', type: 'email' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user workflows

**Coverage**:

- Full wallet setup and usage
- Multi-user scenarios
- Session key lifecycle
- Account recovery workflows
- Cross-feature integration

**Example**:

```typescript
it('should complete full wallet setup and transaction flow', async () => {
  // 1. Authenticate
  await testHelper.authenticateUser('e2e@test.com');
  
  // 2. Create account
  const account = await testHelper.createSmartAccount();
  
  // 3. Create session key
  const session = await testHelper.createSessionKey();
  
  // 4. Send transaction
  const tx = await testHelper.sendTransaction(recipientAddress);
  
  // 5. Verify all operations
  expect(account.address).toBeValidEthereumAddress();
  expect(tx.hash).toBeValidTransactionHash();
});
```

### 4. Error Handling Tests

**Purpose**: Test error conditions and edge cases

**Coverage**:

- Malformed requests
- Authentication failures
- Concurrent operations
- Large payloads
- Unicode handling
- Performance under load

## Test Utilities

### ApiTestHelper Class

Provides convenient methods for testing:

```typescript
const testHelper = new ApiTestHelper(app);

// Authentication
const user = await testHelper.authenticateUser('test@example.com');

// Account operations
const account = await testHelper.createSmartAccount();

// Session management
const session = await testHelper.createSessionKey(permissions);

// Transactions
const tx = await testHelper.sendTransaction(recipient, value);

// Recovery
const recovery = await testHelper.initiateRecovery(address, guardians);

// Cleanup
await testHelper.disconnectUser();
```

### Mock Data Generator

Generates realistic test data:

```typescript
MockDataGenerator.generateEthereumAddress()     // Valid Ethereum address
MockDataGenerator.generateTransactionHash()     // Valid transaction hash
MockDataGenerator.generateUser()               // User object
MockDataGenerator.generateSessionPermissions() // Session permissions
```

### Custom Jest Matchers

Extended matchers for blockchain-specific assertions:

```typescript
expect(response.body).toBeValidApiResponse();
expect(address).toBeValidEthereumAddress();
expect(hash).toBeValidTransactionHash();
```

## Mock System

### Alchemy Client Mock

The test suite uses a comprehensive mock implementation that:

- Simulates real Alchemy client behavior
- Generates realistic responses
- Maintains state consistency
- Supports all authentication flows

### Viem Mock

Mocks the Viem library to avoid blockchain dependencies:

- Mock public/wallet clients
- Simulated balance/block queries
- Transaction simulation

## Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000
};
```

### Test Environment Variables

Tests use separate configuration:

```bash
NODE_ENV=test
PORT=3002
ALCHEMY_API_KEY=test_api_key
TEST_VERBOSE=false  # Set to true for detailed logs
```

## Coverage Reporting

### Coverage Targets

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >85%
- **Lines**: >80%

### Coverage Reports

- **Terminal**: Summary during test runs
- **HTML**: Detailed report in `coverage/lcov-report/index.html`
- **LCOV**: Machine-readable format in `coverage/lcov.info`

### Viewing Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## Best Practices

### Test Writing Guidelines

1. **Descriptive Names**: Use clear, descriptive test names
2. **AAA Pattern**: Arrange, Act, Assert
3. **Isolation**: Each test should be independent
4. **Cleanup**: Always clean up resources
5. **Realistic Data**: Use realistic test data

### Example Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should perform expected behavior', async () => {
    // Arrange
    const testData = { /* ... */ };

    // Act
    const result = await performAction(testData);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
```

### Mock Guidelines

1. **Behavior Over Implementation**: Mock behavior, not implementation details
2. **Realistic Responses**: Ensure mocks return realistic data
3. **State Management**: Maintain proper state in mocks
4. **Error Scenarios**: Include error condition mocks

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run lint
      - run: npm run type-check
```

### Test Reports

- Coverage reports uploaded to codecov/coveralls
- Test results in JUnit format for CI integration
- Performance metrics tracked over time

## Debugging Tests

### Common Issues

1. **Timeout Errors**: Increase Jest timeout or optimize test performance
2. **Async Issues**: Ensure proper async/await usage
3. **Mock Conflicts**: Clear mocks between tests
4. **State Leakage**: Proper cleanup in afterEach hooks

### Debugging Commands

```bash
# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand tests/specific.test.ts

# Verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="specific test name"
```

### IDE Integration

**VS Code Configuration** (`.vscode/launch.json`):

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Performance Considerations

### Test Performance

- Parallel execution enabled by default
- Database operations mocked to avoid I/O overhead
- Network requests mocked to eliminate external dependencies
- Optimized test cleanup to prevent memory leaks

### Load Testing

The test suite includes performance tests that verify:

- Concurrent request handling
- Large payload processing
- Rapid operation sequences
- Memory usage under load

## Maintenance

### Regular Tasks

1. Update test data when API changes
2. Review and update mocks when dependencies change
3. Maintain test coverage above target thresholds
4. Optimize slow tests
5. Clean up obsolete tests

### Monitoring

- Track test execution time trends
- Monitor coverage regression
- Review flaky test patterns
- Update dependencies regularly

## Troubleshooting

### Common Solutions

**Tests timing out**:

- Increase Jest timeout in configuration
- Use proper async/await patterns
- Check for unresolved promises

**Mock not working**:

- Verify mock is loaded before test
- Check module path in jest.mock()
- Ensure mock returns expected structure

**Coverage gaps**:

- Add tests for uncovered branches
- Test error conditions
- Include integration scenarios

**Flaky tests**:

- Add proper cleanup
- Use deterministic test data
- Avoid time-dependent assertions

For additional help, check the Jest documentation and project-specific issues in the repository.
