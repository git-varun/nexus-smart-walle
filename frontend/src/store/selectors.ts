import {RootState} from './store';

// Smart Account selectors
export const selectSmartAccountAddress = (state: RootState) => state.smartAccount.smartAccountAddress;
export const selectSmartAccountInfo = (state: RootState) => state.smartAccount.smartAccountInfo;
export const selectIsCreatingAccount = (state: RootState) => state.smartAccount.isCreatingAccount;
export const selectCreationError = (state: RootState) => state.smartAccount.creationError;
export const selectIsExecuting = (state: RootState) => state.smartAccount.isExecuting;
export const selectIsLoading = (state: RootState) => state.smartAccount.isLoading;
export const selectNewGuardian = (state: RootState) => state.smartAccount.newGuardian;
export const selectGuardianError = (state: RootState) => state.smartAccount.guardianError;

// Smart Account Objects selectors
export const selectSmartAccount = (state: RootState) => state.smartAccountObjects.smartAccount;
export const selectSmartAccountClient = (state: RootState) => state.smartAccountObjects.smartAccountClient;

// Derived selectors
export const selectIsSmartAccountReady = (state: RootState) => {
    const address = selectSmartAccountAddress(state);
    const account = selectSmartAccount(state);
    const client = selectSmartAccountClient(state);
    return !!(address && account && client);
};

export const selectSmartAccountBalance = (state: RootState) =>
    state.smartAccount.smartAccountInfo?.balance || '0';

export const selectSmartAccountNonce = (state: RootState) =>
    state.smartAccount.smartAccountInfo?.nonce || 0;

export const selectIsSmartAccountDeployed = (state: RootState) =>
    state.smartAccount.smartAccountInfo?.isDeployed || false;
