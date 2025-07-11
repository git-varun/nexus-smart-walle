# 🧾 Smart Wallet ERC-4337

> **Modular Smart Wallet with ERC-4337 Account Abstraction**

A production-ready demonstration of ERC-4337 Account Abstraction featuring gasless transactions, session keys, and modular architecture. Built as a hiring portfolio project showcasing advanced Ethereum engineering.

[![CI/CD](https://github.com/your-username/smart-wallet-erc4337/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/your-username/smart-wallet-erc4337/actions)
[![Coverage](https://codecov.io/gh/your-username/smart-wallet-erc4337/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/smart-wallet-erc4337)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **ERC-4337 Compliance**: Full Account Abstraction with EntryPoint integration
- **Gasless Transactions**: Sponsored transactions via Verifying Paymaster
- **Session Keys**: Temporary access control with spending limits
- **Modular Architecture**: Pluggable modules for extensibility
- **Recovery System**: Guardian-based account recovery
- **Modern Frontend**: React + TypeScript with Alchemy SDK integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │────│  Alchemy Bundler │────│ Base Sepolia    │
│   + Wagmi/Viem  │    │  + AA SDK        │    │ Testnet         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            │           Smart Contracts                │
            │  ┌─────────────────────────────────────┐ │
            │  │         SmartAccount.sol            │ │
            │  │    (ERC-4337 Wallet Logic)          │ │
            │  └─────────────────────────────────────┘ │
            │  ┌─────────────────────────────────────┐ │
            │  │      SessionKeyModule.sol           │ │
            │  │   (Temporary Access Control)        │ │
            │  └─────────────────────────────────────┘ │
            │  ┌─────────────────────────────────────┐ │
            │  │     VerifyingPaymaster.sol          │ │
            │  │      (Gas Sponsorship)              │ │
            │  └─────────────────────────────────────┘ │
            └─────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.24** - Contract development
- **Hardhat** - Development framework
- **OpenZeppelin** - Security-audited contract libraries
- **ERC-4337** - Account Abstraction standard

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wagmi + Viem** - Ethereum interaction
- **Alchemy SDK** - Account Abstraction utilities
- **Tailwind CSS** - Styling

### Infrastructure
- **Base Sepolia** - Testnet deployment
- **Alchemy** - RPC provider and bundler
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Frontend hosting

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm >= 8.0.0
git
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/smart-wallet-erc4337.git
cd smart-wallet-erc4337
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your API keys:
# - ALCHEMY_API_KEY
# - PRIVATE_KEY
# - ETHERSCAN_API_KEY
# - VITE_WALLETCONNECT_PROJECT_ID
```

4. **Start development**
```bash
# Terminal 1: Start local blockchain
npm run dev:contracts

# Terminal 2: Start frontend
npm run dev:frontend
```

### Testing

```bash
# Run contract tests
npm run test:contracts

# Generate coverage report
npm run test:coverage

# Run frontend type checking
cd frontend && npm run type-check
```

## 📦 Project Structure

```
smart-wallet-erc4337/
├── contracts/                 # Hardhat project
│   ├── contracts/
│   │   ├── core/              # Core smart account
│   │   ├── modules/           # Modular extensions
│   │   ├── paymaster/         # Gas sponsorship
│   │   └── interfaces/        # Contract interfaces
│   ├── test/                  # Contract tests
│   └── scripts/               # Deployment scripts
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # External services
│   │   └── utils/             # Utilities
│   └── public/                # Static assets
├── docs/                      # Documentation
└── .github/workflows/         # CI/CD
```

## 🔧 Smart Contracts

### Core Contracts

| Contract | Description | Features |
|----------|-------------|----------|
| `SmartAccount.sol` | ERC-4337 wallet implementation | Owner management, module system, execution |
| `SmartAccountFactory.sol` | Account deployment factory | CREATE2 deterministic addresses |
| `SessionKeyModule.sol` | Session key management | Spending limits, time bounds, target whitelisting |
| `VerifyingPaymaster.sol` | Gas sponsorship | Signature verification, deposit management |
| `RecoveryModule.sol` | Account recovery | Guardian-based recovery, time delays |

### Key Features

#### 🔑 Session Keys
```solidity
struct SessionKey {
    address key;
    uint256 spendingLimit;    // Per-transaction limit
    uint256 dailyLimit;       // Daily spending limit
    uint256 expiryTime;       // Expiration timestamp
    address[] allowedTargets; // Contract whitelist
    bool isActive;
}
```

#### 💰 Gas Sponsorship
- Off-chain signature verification
- Configurable spending policies
- Automatic deposit management
- Abuse prevention mechanisms

#### 🛡️ Security Features
- EIP-1271 signature validation
- Modular permission system
- Guardian-based recovery
- Time-delayed critical operations

## 🌐 Frontend Features

### Wallet Management
- **Connect Wallet**: MetaMask, WalletConnect integration
- **Account Info**: Balance, nonce, deployment status
- **Transaction History**: Real-time UserOperation tracking

### Session Key Management
- **Create Session Keys**: Set limits and permissions
- **Active Sessions**: View and manage active sessions
- **Revoke Access**: Instant session key revocation

### Transaction Interface
- **Execute Transactions**: Single and batch operations
- **Gasless Mode**: Paymaster-sponsored transactions
- **Status Tracking**: Real-time bundler integration

## 🚀 Deployment

### Testnet Deployment

```bash
# Deploy contracts to Base Sepolia
npm run deploy:testnet

# Verify contracts on Etherscan
cd contracts && npm run verify:base-sepolia
```

### Frontend Deployment

```bash
# Build frontend
cd frontend && npm run build

# Deploy to Vercel (automated via GitHub Actions)
git push origin main
```

## 📊 Testing & Coverage

- **Unit Tests**: 100% coverage requirement
- **Integration Tests**: End-to-end bundler simulation
- **Security Audits**: Slither static analysis
- **Gas Optimization**: Gas reporter integration

```bash
# Run full test suite
npm test

# Generate coverage report
npm run test:coverage

# Security analysis
cd contracts && slither .
```

## 🔍 Monitoring & Analytics

- **Transaction Tracking**: Alchemy dashboard integration
- **Gas Usage**: Real-time cost monitoring
- **Error Handling**: Sentry error tracking
- **Performance**: Lighthouse CI scores

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ERC-4337 Team](https://erc4337.io/) - Account Abstraction standard
- [Alchemy](https://alchemy.com/) - Account Abstraction infrastructure
- [OpenZeppelin](https://openzeppelin.com/) - Security-focused contract libraries
- [Base](https://base.org/) - L2 infrastructure

## 📞 Contact

- **Developer**: Your Name
- **Email**: your.email@example.com
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- **Portfolio**: [Your Portfolio](https://yourportfolio.com)

---

**Built with ❤️ for the Ethereum ecosystem**