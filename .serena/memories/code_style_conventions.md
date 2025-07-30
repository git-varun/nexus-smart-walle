# Code Style & Conventions

## TypeScript/React Conventions

- **TypeScript** used throughout with strict type checking
- **Functional components** with React hooks
- **Props interfaces** defined for all components (e.g., `WalletConnectProps`, `ButtonProps`)
- **Consistent naming**: PascalCase for components, camelCase for variables/functions
- **ESLint rules**:
    - Unused vars: error (with `_` prefix ignore pattern)
    - No explicit any: warn
    - React hooks recommended rules

## File Structure Patterns

- **Components**: Organized by feature (wallet/, session/, recovery/, ui/, etc.)
- **Hooks**: Custom hooks in `/hooks` directory
- **Types**: TypeScript interfaces defined per component
- **Config**: Centralized configuration files

## Import Patterns

- **Relative imports** for local components
- **Absolute imports** from node_modules
- **Viem/Wagmi** for Ethereum interactions
- **Alchemy SDK** for Account Abstraction

## State Management

- **Zustand** for global state (store/smartAccountSlice.ts)
- **React hooks** for local component state
- **React Query** for server state management

## Styling

- **Tailwind CSS** for styling
- **Consistent utility classes**: bg-slate-800, text-slate-300, etc.
- **Component variants**: Using class-variance-authority for button variants
