# Project Structure

## Root Structure

```
nexus-smart-wallet/
├── contracts/                 # Hardhat project
├── frontend/                  # React application  
├── docs/                      # Documentation
├── .github/workflows/         # CI/CD
└── package.json              # Root package with workspace scripts
```

## Frontend Structure (`frontend/src/`)

```
frontend/src/
├── components/               # UI components
│   ├── analytics/           # Analytics dashboard
│   ├── examples/            # Example components  
│   ├── infrastructure/      # Alchemy-specific components
│   ├── layout/              # Layout components
│   ├── modules/             # Module management
│   ├── recovery/            # Account recovery
│   ├── session/             # Session key management
│   ├── transaction/         # Transaction interface
│   ├── ui/                  # Reusable UI components
│   └── wallet/              # Wallet components
├── config/                  # Configuration files
│   ├── alchemy.ts          # Alchemy SDK config
│   ├── environments.ts     # Environment settings
│   └── wagmi.ts            # Wagmi configuration
├── core/                    # Core business logic
├── hooks/                   # Custom React hooks
├── store/                   # Zustand state management
├── constants/               # Application constants
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

## Contracts Structure (`contracts/`)

```
contracts/
├── contracts/               # Solidity contracts
│   ├── core/               # Core smart account
│   ├── modules/            # Modular extensions
│   ├── paymaster/          # Gas sponsorship
│   └── interfaces/         # Contract interfaces
├── test/                   # Contract tests
└── scripts/                # Deployment scripts
```
