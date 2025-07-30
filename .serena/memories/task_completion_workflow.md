# Task Completion Workflow

## When a coding task is completed, run these commands:

### 1. Linting

```bash
# Frontend linting
cd frontend && npm run lint

# Fix auto-fixable issues
cd frontend && npm run lint:fix

# Contract linting  
cd contracts && npm run lint
```

### 2. Type Checking

```bash
# Frontend type checking
cd frontend && npm run type-check
```

### 3. Testing

```bash
# Run contract tests
npm run test:contracts

# For comprehensive testing
npm run test:coverage
```

### 4. Building

```bash
# Ensure everything builds
npm run build
```

## Pre-commit Checklist

- [ ] Code follows TypeScript/ESLint conventions
- [ ] All lint issues resolved
- [ ] Type checking passes
- [ ] Tests pass (if applicable)
- [ ] Build succeeds
- [ ] No console.log statements in production code (debug statements are marked as debug)

## Development Best Practices

- Use the monorepo structure with appropriate workspace commands
- Test changes locally with `npm run dev`
- Check gas usage for contract changes with `npm run gas-report`
- Verify contract deployments with verification scripts
