# Nexus Smart Wallet Backend

RESTful API backend for the Nexus Smart Wallet application, providing secure smart account management and transaction
processing.

## Features

- **Authentication**: Email-based authentication with smart account creation
- **Smart Accounts**: ERC-4337 smart account management via Alchemy SDK
- **Transactions**: UserOperation handling and transaction status tracking
- **Session Keys**: Temporary key management with permissions and expiration
- **Recovery**: Guardian-based account recovery system

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev
```

Server will start on http://localhost:3001

## API Endpoints

### Authentication

- `POST /api/auth/connect` - Connect wallet with email
- `POST /api/auth/disconnect` - Disconnect wallet
- `GET /api/auth/status` - Get authentication status

### Smart Accounts

- `POST /api/accounts/create` - Create smart account
- `GET /api/accounts/:address` - Get account information

### Transactions

- `POST /api/transactions/send` - Send transaction
- `GET /api/transactions/:hash` - Get transaction status

### Session Keys

- `POST /api/session/create` - Create session key
- `GET /api/session/list` - List active session keys
- `DELETE /api/session/:id` - Revoke session key

### Recovery

- `POST /api/recovery/initiate` - Start recovery process
- `GET /api/recovery/:id/status` - Get recovery status

## Architecture

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── providers/       # External service integrations
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
