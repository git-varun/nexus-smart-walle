# Nexus Smart Wallet Backend - AI Development Guide

<!--
system: |
  You are an expert AI engineer. For every task, follow this strict structure:
  1. Ask clarifying questions (Q&A)
  2. Provide pros & cons of approaches
  3. Go step-by-step with technical reasoning
  4. Output minimal working code only — no full boilerplate
  Never skip these steps unless told to.
-->

## Project Overview

A Node.js/TypeScript backend service for a smart wallet application using Account Abstraction with Alchemy integration.
The system supports dual authentication (email + EOA), session management, transaction handling, and account recovery.

## Key Architecture Decisions

### Authentication System

- **Dual Auth Pattern**: Supports both email-based and EOA (Externally Owned Account) authentication
- **Session Management**: JWT-based sessions with expiration and refresh capabilities
- **Alchemy Integration**: Uses Alchemy Account Kit for smart account operations

### Multi-Chain Support

- **EVM Chains**: Ethereum, Base, Polygon, Arbitrum, Optimism
- **Fallback Mechanism**: Automatic RPC failover with retry logic
- **Environment-Based**: Chain selection via CHAIN_ID environment variable

## Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript to JavaScript
npm run type-check      # Run TypeScript type checking without compilation
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically

# Testing
npm test                # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:ci         # Run tests for CI environment

# Production
npm start               # Start production server (requires build)
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── chains.ts           # Multi-chain EVM configuration
│   ├── controllers/            # Request handlers
│   │   ├── accounts.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── sessions.controller.ts
│   │   ├── transactions.controller.ts
│   │   └── recovery.controller.ts
│   ├── routes/                 # API route definitions
│   │   ├── accounts.route.ts
│   │   ├── auth.route.ts
│   │   ├── sessions.route.ts
│   │   ├── transactions.route.ts
│   │   └── recovery.route.ts
│   ├── services/               # Business logic layer
│   │   ├── accounts.service.ts
│   │   ├── auth.service.ts
│   │   ├── sessions.service.ts
│   │   ├── transactions.service.ts
│   │   └── recovery.service.ts
│   ├── utils/                  # Utility functions
│   │   ├── clientFactory.ts    # Robust blockchain client creation
│   │   └── logger.ts           # Structured logging system
│   ├── middleware/             # Express middleware
│   │   └── errorHandler.ts
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   ├── app.ts                  # Express app configuration
│   └── index.ts                # Application entry point
├── tests/                      # Test files
└── logs/                       # Application logs (auto-created)
```

## Key Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Blockchain**: Viem (Ethereum library)
- **Account Abstraction**: Alchemy Account Kit
- **Testing**: Jest with TypeScript support
- **Logging**: Custom structured logger with file/console output
- **Validation**: Express validator middleware

## Environment Configuration

### Required Variables

```bash
# Alchemy Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_POLICY_ID=your_alchemy_policy_id_here

# Blockchain Configuration  
CHAIN_ID=84532                              # Default: Base Sepolia
RPC_URL=https://your-custom-rpc.com         # Optional: Custom RPC override
FALLBACK_RPC_URLS=url1,url2,url3           # Optional: Fallback RPCs
PRIVATE_KEY=0x1234...                       # Optional: For wallet client

# RPC Configuration
ENABLE_RPC_RETRY=true
RPC_RETRY_ATTEMPTS=3
RPC_RETRY_DELAY=1000
RPC_REQUEST_TIMEOUT=10000

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_SECRET=your_jwt_secret_here

# Logging
LOG_LEVEL=INFO                              # ERROR, WARN, INFO, DEBUG, TRACE
LOG_DIR=./logs                              # Optional: Custom log directory
```

### Supported Chain IDs

- `1`: Ethereum Mainnet
- `11155111`: Ethereum Sepolia (Testnet)
- `8453`: Base Mainnet
- `84532`: Base Sepolia (Testnet)
- `137`: Polygon Mainnet
- `42161`: Arbitrum One
- `10`: Optimism Mainnet

## API Endpoints

### Authentication (`/api/auth`)

- `POST /authenticate` - Email or EOA authentication
- `POST /logout` - Session logout
- `GET /status` - Authentication status
- `POST /refresh` - Refresh session token

### Accounts (`/api/accounts`)

- `POST /create` - Create smart account
- `GET /:address` - Get account details
- `GET /:address/balance` - Get account balance

### Sessions (`/api/session`)

- `POST /create` - Create session key
- `GET /` - List session keys
- `DELETE /:sessionId` - Revoke session key
- `GET /:sessionId/validate` - Validate session key

### Transactions (`/api/transactions`)

- `POST /send` - Send transaction
- `GET /:hash/status` - Get transaction status
- `GET /history` - Get transaction history
- `POST /estimate-gas` - Estimate gas for transaction

### Recovery (`/api/recovery`)

- `POST /initiate` - Start account recovery
- `POST /approve` - Guardian approval
- `POST /execute` - Execute recovery
- `GET /:requestId/status` - Recovery status

### System

- `GET /health` - System health check with blockchain connectivity

## Common Development Patterns

### Service Layer Pattern

All business logic is in services with singleton pattern:

```typescript
export class SomeService {
    private static instance: SomeService;
    
    public static getInstance(): SomeService {
        if (!SomeService.instance) {
            SomeService.instance = new SomeService();
        }
        return SomeService.instance;
    }
}
```

### Dual Authentication Support

Services support both email and EOA authentication:

```typescript
public async someMethod(params: {
    email?: string;
    eoaAddress?: string;
    // other params
}): Promise<{ success: boolean; data?: any; error?: any }> {
    // Implementation handles both auth types
}
```

### Consistent Error Handling

All services return standardized response format:

```typescript
return {
    success: boolean;
    data?: any;           // Present on success
    error?: {             // Present on failure
        code: string;
        message: string;
    }
};
```

### Logging Pattern

Use structured logging throughout:

```typescript
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('ServiceName');

logger.info('Operation started', { param1, param2 });
logger.error('Operation failed', error, { context });
logger.performance('Operation completed', durationMs);
```

## Database Integration (MongoDB)

**✅ IMPLEMENTED** - Full MongoDB integration with backward compatibility

### MongoDB Architecture

**Database Collections:**

- `users` - User accounts with email/EOA support
- `auth_sessions` - JWT session management with TTL
- `smart_accounts` - Smart contract account details
- `transactions` - Transaction history with analytics
- `session_keys` - Session key permissions
- `recovery_requests` - Account recovery workflow

**Repository Pattern:**

```typescript
// All repositories follow singleton pattern with CRUD operations
const userRepo = UserRepository.getInstance();
const user = await userRepo.createUser({ userId: '123', email: 'test@example.com' });
```

**Adapter Layer:**

```typescript
// Seamless integration with fallback capability
const authAdapter = new AuthSessionAdapter();
await authAdapter.createSession({id: 'session_123', userId: '123'});
```

### Configuration

**Environment Variables:**

```bash
# Core MongoDB settings
USE_DATABASE=true
MONGODB_URI=mongodb://localhost:27017/nexus-wallet
MONGODB_DB_NAME=nexus-wallet

# Migration settings  
MONGODB_FALLBACK_TO_MEMORY=true
MONGODB_DUAL_WRITE=false

# Enhanced services
USE_ENHANCED_AUTH_SERVICE=true
ENABLE_AUTH_SESSION_MIGRATION=true
```

**Feature Flags:**

- `USE_MONGODB` - Enable/disable MongoDB integration
- `MONGODB_FALLBACK_TO_MEMORY` - Automatic fallback to memory storage
- `USE_ENHANCED_AUTH_SERVICE` - Use MongoDB-integrated AuthService

### Migration Commands

```bash
# Check migration status
npm run migrate:status

# Perform service migration
npm run migrate:services

# Test MongoDB connection
npm run test:mongo

# Test database operations
npm run test:db
```

### Service Integration Status

**✅ AuthService**: Enhanced version with MongoDB integration and adapter pattern

- Automatic fallback to memory storage
- Session persistence across restarts
- Advanced session analytics
- Migration utility from legacy service

**🔄 Other Services**: Can be integrated using the same adapter pattern

### Advanced Features

**Analytics & Reporting:**

```typescript
// Get comprehensive session statistics
const stats = await authService.getSessionStats();
// { totalSessions: 150, activeSessions: 45, storageType: 'database' }

// Health monitoring
const health = await authService.getHealthStatus();
```

**Bulk Operations:**

```typescript
// Efficient batch processing
await transactionRepo.bulkUpdateTransactionStatus(updates);
await sessionRepo.bulkRevokeSessionKeys(sessionIds);
```

**Security Features:**

```typescript
// Suspicious activity detection
const suspicious = await sessionRepo.findSuspiciousActivity();
const guardianReport = await recoveryRepo.getGuardianActivityReport(address);
```

### Migration Strategy (Completed)

1. **✅ Phase 1**: Database foundation (schemas, repositories, connection)
2. **✅ Phase 2**: Repository implementation with advanced features
3. **✅ Phase 3**: Service integration with adapter layer
4. **⏳ Phase 4**: Complete service migration (incremental)

**Deployment Strategy:**

- **Blue-Green**: Run both legacy and enhanced services
- **Feature Flags**: Gradual rollout with instant rollback
- **Health Checks**: Monitor both storage systems
- **Automatic Fallback**: Seamless degradation if needed

## Security Considerations

### Current Implementation

- Helmet.js for security headers
- CORS configuration
- Input validation on routes
- JWT session management
- Private key handling (environment variables only)
- Sanitized logging (no sensitive data in logs)

### Production Recommendations

- Implement rate limiting
- Add API key authentication
- Use HashiCorp Vault or similar for secret management
- Implement request signing validation
- Add monitoring and alerting
- Use HTTPS only
- Implement audit logging

## Testing Strategy

### Current Setup

- Jest test framework
- Unit tests for services
- Test utilities for mocking
- Coverage reporting

### Test Categories

```bash
# Unit Tests
tests/unit/services/        # Service logic tests
tests/unit/utils/          # Utility function tests

# Integration Tests  
tests/integration/api/     # API endpoint tests
tests/integration/db/      # Database integration tests

# End-to-End Tests
tests/e2e/                 # Full workflow tests
```

### Testing Patterns

```typescript
// Service testing pattern
const mockAlchemyClient = {
    authenticate: jest.fn(),
    sendTransaction: jest.fn(),
    // ... other methods
};

beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
});
```

## Common Issues & Solutions

### Type Errors

- **Chain Interface**: Remove `network` property (not supported by viem)
- **Variable Scope**: Use `params.field` instead of destructured variables in catch blocks
- **Optional Fields**: Handle undefined values with fallbacks or proper typing

### RPC Connection Issues

- **Fallback System**: Automatically tries backup RPCs
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Health Checks**: Monitor connection status via `/health` endpoint

### Session Management

- **Expiration**: Sessions auto-expire, implement refresh logic
- **Cleanup**: Use `clearExpiredSessions()` periodically
- **Validation**: Always validate sessions before operations

## Performance Optimization

### Current Optimizations

- Connection pooling for RPC calls
- Singleton pattern for services
- Structured logging with performance metrics
- Efficient fallback mechanisms

### Monitoring

- Health check endpoint with latency tracking
- Structured logs for performance analysis
- Service-specific loggers for debugging

### Scaling Considerations

- Stateless service design
- External session storage (Redis)
- Database connection pooling
- Load balancer compatibility

## Development Workflow

1. **Make Changes**: Edit TypeScript files in `src/`
2. **Type Check**: Run `npm run type-check` to verify types
3. **Test**: Run `npm test` for unit tests
4. **Lint**: Run `npm run lint:fix` to fix code style
5. **Manual Test**: Use `npm run dev` and test endpoints
6. **Build**: Run `npm run build` before deployment

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure production database
- [ ] Set up proper logging infrastructure
- [ ] Configure monitoring and alerting
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up backup and recovery procedures
- [ ] Verify chain configurations for target networks
- [ ] Test RPC endpoints and fallbacks
- [ ] Validate Alchemy API keys and quotas

## Troubleshooting

### Common Commands

```bash
# Check type errors
npm run type-check

# View application logs
tail -f logs/app.log

# Check service health
curl http://localhost:3000/health

# Verify environment
node -e "console.log(process.env.CHAIN_ID)"
```

### Debug Mode

Set `LOG_LEVEL=DEBUG` for detailed logging including:

- RPC call attempts and failures
- Session creation and validation
- Transaction processing steps
- Authentication flows

This file should be updated as the project evolves and new patterns emerge.
