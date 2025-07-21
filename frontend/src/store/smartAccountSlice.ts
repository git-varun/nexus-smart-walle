import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {SmartAccountInfo} from '../types/account';

interface SmartAccountState {
    // Core smart account data
    smartAccountAddress: string;
    smartAccountInfo: SmartAccountInfo | null;

    // Creation state
    isCreatingAccount: boolean;
    creationError: string | null;

    // Transaction state
    isExecuting: boolean;

    // Loading states
    isLoading: boolean;

    // Guardian management
    newGuardian: string;
    guardianError: string;

    // These can't be serialized, so we'll handle them separately
    // smartAccount: any | null;
    // smartAccountClient: any | null;
}

const initialState: SmartAccountState = {
    smartAccountAddress: '',
    smartAccountInfo: null,
    isCreatingAccount: false,
    creationError: null,
    isExecuting: false,
    isLoading: false,
    newGuardian: '',
    guardianError: '',
};

const smartAccountSlice = createSlice({
    name: 'smartAccount',
    initialState,
    reducers: {
        // Smart account creation
        setSmartAccountAddress: (state, action: PayloadAction<string>) => {
            state.smartAccountAddress = action.payload;
        },

        setSmartAccountInfo: (state, action: PayloadAction<SmartAccountInfo | null>) => {
            state.smartAccountInfo = action.payload;
        },

        // Creation state management
        setIsCreatingAccount: (state, action: PayloadAction<boolean>) => {
            state.isCreatingAccount = action.payload;
            if (action.payload) {
                state.creationError = null; // Clear error when starting
            }
        },

        setCreationError: (state, action: PayloadAction<string | null>) => {
            state.creationError = action.payload;
            if (action.payload) {
                state.isCreatingAccount = false; // Stop creation on error
            }
        },

        // Transaction state
        setIsExecuting: (state, action: PayloadAction<boolean>) => {
            state.isExecuting = action.payload;
        },

        // Loading state
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },

        // Guardian management
        setNewGuardian: (state, action: PayloadAction<string>) => {
            state.newGuardian = action.payload;
            state.guardianError = ''; // Clear error when typing
        },

        setGuardianError: (state, action: PayloadAction<string>) => {
            state.guardianError = action.payload;
        },

        // Reset all state (useful for wallet disconnection)
        resetSmartAccountState: () => initialState,

        // Complete smart account setup (called after successful creation)
        completeAccountCreation: (state, action: PayloadAction<{ address: string; info?: SmartAccountInfo }>) => {
            state.smartAccountAddress = action.payload.address;
            state.smartAccountInfo = action.payload.info || null;
            state.isCreatingAccount = false;
            state.creationError = null;
        },
    },
});

export const {
    setSmartAccountAddress,
    setSmartAccountInfo,
    setIsCreatingAccount,
    setCreationError,
    setIsExecuting,
    setIsLoading,
    setNewGuardian,
    setGuardianError,
    resetSmartAccountState,
    completeAccountCreation,
} = smartAccountSlice.actions;

export default smartAccountSlice.reducer;
