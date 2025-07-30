# Suggested Commands

## Installation & Setup

```bash
npm run install:all           # Install all dependencies (root, contracts, frontend)
npm run install:contracts     # Install contract dependencies only
npm run install:frontend      # Install frontend dependencies only
```

## Development

```bash
npm run dev                   # Start both contracts and frontend development
npm run dev:contracts         # Start local blockchain (Hardhat node)
npm run dev:frontend          # Start frontend development server
```

## Building

```bash
npm run build                 # Build contracts and frontend
npm run build:contracts       # Compile smart contracts
npm run build:frontend        # Build frontend for production
```

## Testing

```bash
npm run test                  # Run contract tests
npm run test:contracts        # Run contract tests
npm run test:coverage         # Generate coverage report
cd frontend && npm run type-check  # Run frontend type checking
```

## Linting & Formatting

```bash
npm run lint                  # Lint contracts and frontend
npm run lint:contracts        # Lint contracts with solhint
npm run lint:frontend         # Lint frontend with eslint
cd frontend && npm run lint:fix    # Auto-fix frontend lint issues
```

## Contract Specific

```bash
cd contracts && npm run compile      # Compile contracts
cd contracts && npm run gas-report   # Generate gas usage report
cd contracts && npm run size         # Check contract sizes
```

## Deployment

```bash
npm run deploy:testnet        # Deploy to Base Sepolia
cd contracts && npm run verify:base-sepolia  # Verify contracts
```

## Utilities

```bash
npm run clean                 # Clean build artifacts
npm run clean:contracts       # Clean contract artifacts
npm run clean:frontend        # Clean frontend build
```
