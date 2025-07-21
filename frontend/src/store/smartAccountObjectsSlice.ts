import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SmartAccountObjectsState {
    // Non-serializable objects that can't be persisted
    smartAccount: any | null;
    smartAccountClient: any | null;
}

const initialState: SmartAccountObjectsState = {
    smartAccount: null,
    smartAccountClient: null,
};

const smartAccountObjectsSlice = createSlice({
    name: 'smartAccountObjects',
    initialState,
    reducers: {
        setSmartAccount: (state, action: PayloadAction<any | null>) => {
            state.smartAccount = action.payload;
        },

        setSmartAccountClient: (state, action: PayloadAction<any | null>) => {
            state.smartAccountClient = action.payload;
        },

        setSmartAccountObjects: (state, action: PayloadAction<{ account: any; client: any }>) => {
            state.smartAccount = action.payload.account;
            state.smartAccountClient = action.payload.client;
        },

        clearSmartAccountObjects: (state) => {
            state.smartAccount = null;
            state.smartAccountClient = null;
        },
    },
});

export const {
    setSmartAccount,
    setSmartAccountClient,
    setSmartAccountObjects,
    clearSmartAccountObjects,
} = smartAccountObjectsSlice.actions;

export default smartAccountObjectsSlice.reducer;
