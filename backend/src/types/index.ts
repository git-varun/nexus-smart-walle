// ============================================================================
// SIMPLIFIED TYPES EXPORT
// ============================================================================

// Domain types (core business entities)
export type {
    // User types
    User,
    CreateUserInput,
    UpdateUserInput,

    // Smart Account types
    SmartAccount,
    CreateSmartAccountInput,
    UpdateSmartAccountInput,

    // Transaction types
    Transaction,
    TransactionStatus,
    CreateTransactionInput,
    UpdateTransactionInput,

    // Session types
    Session,
    CreateSessionInput
} from './domain';

// API & Service types (authentication, services, middleware)
export type {
    // Authentication types
    AuthResult,
    SessionValidationResult,
    AuthStatusResult,
    AuthenticateUserParams,

    // Middleware types
    AuthenticatedRequest,
    ApiError,

    // Service result types
    SmartAccountResult,
    CreateSmartAccountParams,
    TransactionRequest,
    TransactionInfo,
    TransactionResult,
    TransactionHistoryResult,
    GasEstimate,
    GasEstimationResult,

    // Alchemy service types
    AlchemyConfig,
    AlchemySmartAccount,
    AlchemyTransaction,
    AlchemyTransactionResult,
    AlchemyUser,
    UserOperation,
    AlchemyServiceInstance,
    AAVersion
} from './api';

// Infrastructure types (database, logging, config)
export type {
    // Database document types
    UserDocument,
    SmartAccountDocument,
    TransactionDocument,
    SessionDocument,
    ConnectionOptions,

    // Utility types
    LogEntry,
    Config
} from './infrastructure';
