import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import smartAccountReducer from './smartAccountSlice';
import smartAccountObjectsReducer from './smartAccountObjectsSlice';

// Persist configuration for the main smart account data
const smartAccountPersistConfig = {
    key: 'smartAccount',
    storage,
    whitelist: [
        'smartAccountAddress',
        'smartAccountInfo',
        'newGuardian'
    ], // Only persist serializable data
    blacklist: [
        'isCreatingAccount',
        'creationError',
        'isExecuting',
        'isLoading',
        'guardianError'
    ], // Don't persist temporary states
};

// Don't persist the objects slice (non-serializable)
const rootReducer = combineReducers({
    smartAccount: persistReducer(smartAccountPersistConfig, smartAccountReducer),
    smartAccountObjects: smartAccountObjectsReducer, // Not persisted
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
                // Ignore non-serializable data in smartAccountObjects
                ignoredPaths: ['smartAccountObjects.smartAccount', 'smartAccountObjects.smartAccountClient'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
