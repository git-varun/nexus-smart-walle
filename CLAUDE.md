# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexus Smart Wallet is a full-stack Web3 application implementing Account Abstraction (ERC-4337) with Alchemy
integration. The project consists of a React/TypeScript frontend and Node.js/Express backend, providing secure smart
account management, transaction handling, and session-based authentication.

## Architecture

```
nexus-smart-wallet/
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/ # UI components organized by domain
│   │   ├── hooks/      # React hooks for state management
│   │   ├── services/   # API client and external integrations
│   │   ├── store/      # Redux store with persistence
│   │   ├── types/      # TypeScript type definitions
│   │   └── utils/      # Utility functions
│   └── package.json
└── backend/            # Node.js + Express API server
    ├── src/
    │   ├── controllers/    # Request handlers
    │   ├── services/      # Business logic layer
    │   ├── repositories/ # Data access layer (MongoDB)
    │   ├── models/       # Database models
    │   ├── routes/       # API route definitions
    │   └── middleware/   # Express middleware
    └── package.json
```

## Development Commands

### Frontend (React + Vite)

```bash
cd frontend
yarn dev             # Start development server (http://localhost:5173)
yarn build           # Build for production
yarn lint            # Run ESLint
yarn lint:fix        # Fix ESLint issues
yarn type-check      # TypeScript type checking
yarn preview         # Preview production build
```

### Backend (Node.js + Express)

```bash
cd backend
yarn dev             # Start development server with hot reload (port 3001)
yarn build           # Compile TypeScript to JavaScript
yarn start           # Start production server
yarn lint            # Run ESLint
yarn lint:fix        # Fix ESLint issues
yarn type-check      # TypeScript type checking without compilation
yarn test            # Run Jest tests
yarn test:watch      # Run tests in watch mode
yarn test:coverage   # Run tests with coverage
```

## Key Technologies

### Frontend Stack

- **React 18** with TypeScript and strict mode
- **Vite** for build tooling and development server
- **Wagmi + RainbowKit** for Web3/wallet integration
- **Redux Toolkit + Redux Persist** for state management
- **TanStack Query** for server state management
- **Tailwind CSS** with custom Web3 theme and animations
- **Radix UI** for accessible component primitives
- **Framer Motion** for animations
- **Account Kit SDK** for Alchemy integration

### Backend Stack

- **Node.js + Express** with TypeScript
- **MongoDB** with Repository pattern for data persistence
- **Alchemy Account Kit** for smart account operations
- **Viem** for Ethereum interactions
- **Jest** for testing with TypeScript support
- **Helmet + CORS** for security
- **Winston-based** structured logging

## Smart Wallet Features

### Core Functionality

- **Dual Authentication**: Email-based and EOA (Externally Owned Account)
- **Smart Account Management**: ERC-4337 compliant account abstraction
- **Multi-Chain Support**: Ethereum, Base, Polygon, Arbitrum, Optimism
- **Session Keys**: Temporary key management with expiration
- **Transaction Management**: UserOperation handling with gas estimation
- **Account Recovery**: Guardian-based recovery system
- **Transaction History**: Comprehensive transaction tracking and analytics

### Web3 Integration

- Account creation via Alchemy Account Kit
- Multi-chain RPC management with fallback
- Smart contract interactions via Viem
- Gas optimization and estimation
- Session-based permissions

## Development Patterns

### Frontend Patterns

```typescript
// Component structure with error boundaries
<ErrorBoundary>
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <MainLayout />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PersistGate>
  </Provider>
</ErrorBoundary>

// Custom hooks pattern
const { account, isLoading, createAccount } = useBackendSmartAccount();
const { sessions, createSession } = useSessionKeys();
```

### Backend Patterns

```typescript
// Service layer with singleton pattern
export class SomeService {
    private static instance: SomeService;
    
    public static getInstance(): SomeService {
        if (!SomeService.instance) {
            SomeService.instance = new SomeService();
        }
        return SomeService.instance;
    }
}

// Standardized response format
return {
    success: boolean;
    data?: any;           // Present on success
    error?: {             // Present on failure
        code: string;
        message: string;
    }
};
```

### Repository Pattern (MongoDB)

```typescript
// All repositories follow singleton pattern
const userRepo = UserRepository.getInstance();
const user = await userRepo.createUser({ userId: '123', email: 'test@example.com' });

// Adapter layer for service integration
const authAdapter = new AuthSessionAdapter();
await authAdapter.createSession({id: 'session_123', userId: '123'});
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /authenticate` - Email or EOA authentication
- `POST /logout` - Session logout
- `GET /status` - Authentication status

### Accounts (`/api/accounts`)

- `POST /create` - Create smart account
- `GET /me` - Get user's accounts
- `GET /:address` - Get account details

### Transactions (`/api/transactions`)

- `POST /send` - Send transaction
- `GET /history` - Transaction history
- `GET /:hash` - Transaction status
- `POST /estimate-gas` - Gas estimation

### Session Management (`/api/session`)

- `POST /create` - Create session key
- `GET /` - List session keys
- `DELETE /:sessionId` - Revoke session key

## Environment Configuration

### Frontend (.env)

```bash
# Alchemy Configuration
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_CHAIN_ID=84532                    # Default: Base Sepolia

# Backend API
VITE_API_URL=http://localhost:3001     # Backend URL
```

### Backend (.env)

```bash
# Alchemy Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_POLICY_ID=your_alchemy_policy_id_here

# Database Configuration
USE_DATABASE=true
MONGODB_URI=mongodb://localhost:27017/nexus-wallet
MONGODB_DB_NAME=nexus-wallet

# Blockchain Configuration
CHAIN_ID=84532                         # Base Sepolia
RPC_URL=https://your-custom-rpc.com    # Optional
FALLBACK_RPC_URLS=url1,url2,url3       # Optional

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_SECRET=your_jwt_secret_here
```

## Testing Strategy

### Backend Testing

```bash
# Unit tests for services and utilities
tests/unit/services/
tests/unit/utils/

# Integration tests for API endpoints
tests/integration/api/
tests/integration/db/

# End-to-end workflow tests
tests/e2e/
```

### Testing Patterns

```typescript
// Service mocking pattern
const mockAlchemyClient = {
    authenticate: jest.fn(),
    sendTransaction: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
});
```

## Styling System

The frontend uses a comprehensive Web3-themed design system:

### Color Palette

- **Neon Colors**: Purple (`#8b5cf6`), Cyan (`#06b6d4`), Green (`#10b981`)
- **Space Colors**: Dark gradients from slate to purple tones
- **Typography**: Plus Jakarta Sans, Manrope, Satoshi fonts

### Animations

- Custom keyframes for fade-in, slide-in, glow, pulse-neon effects
- Framer Motion for complex component animations
- CSS-based hover states and transitions

## Common Development Tasks

### Adding New API Endpoints

1. Create controller in `backend/src/controllers/`
2. Add business logic to service in `backend/src/services/`
3. Define route in `backend/src/routes/`
4. Add types to `backend/src/types/`
5. Write tests in `backend/tests/`

### Adding New Frontend Components

1. Create component in appropriate domain folder under `frontend/src/components/`
2. Add custom hooks if needed in `frontend/src/hooks/`
3. Update store if state management required
4. Add types to `frontend/src/types/`
5. Update API client if backend integration needed

### Database Operations

1. Define model in `backend/src/models/`
2. Create repository in `backend/src/repositories/`
3. Use adapter pattern for service integration
4. Add migration scripts if schema changes needed

## Security Considerations

### Frontend Security

- Environment variables prefixed with `VITE_` for client-side access
- Secure wallet connection via RainbowKit
- XSS protection through React's built-in sanitization
- Content Security Policy via backend headers

### Backend Security

- Helmet.js for security headers
- CORS configuration for allowed origins
- Input validation on all routes
- JWT session management with expiration
- Private key handling via environment variables only
- Sanitized logging (no sensitive data in logs)

## Performance Optimization

### Frontend Optimizations

- Lazy loading of components with React.lazy
- Memoization of expensive calculations
- Redux state normalization
- Optimized bundle splitting via Vite
- Image optimization and lazy loading

### Backend Optimizations

- Connection pooling for database and RPC calls
- Singleton pattern for services
- Structured logging with performance metrics
- Efficient fallback mechanisms for RPC calls
- Caching strategies for frequently accessed data

## Troubleshooting

### Common Issues

- **Type Errors**: Remove `network` property from chain interfaces (viem incompatibility)
- **RPC Connection**: Check fallback RPC configuration and retry settings
- **Session Management**: Validate session expiration and refresh logic
- **Database Connection**: Verify MongoDB URI and connection settings

### Debug Commands

```bash
# Backend debugging
yarn type-check                     # Check TypeScript errors
tail -f backend/logs/app.log          # View application logs
curl http://localhost:3001/health     # Check service health

# Frontend debugging  
yarn type-check                     # Check TypeScript errors
yarn build                         # Test production build
```

For detailed backend-specific guidance, see `backend/CLAUDE.md`.
