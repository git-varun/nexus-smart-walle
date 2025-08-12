// frontend/src/App.tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'
import {RainbowKitProvider} from '@rainbow-me/rainbowkit'
import {Provider} from 'react-redux'
import {PersistGate} from 'redux-persist/integration/react'
import {config} from './config/wagmi'
import {persistor, store} from './store/store'
import {MainLayout} from './components/layout/MainLayout'
import {ErrorBoundary} from './components/ErrorBoundary'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <PersistGate
                    loading={
                        <div
                            className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div
                                    className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-lg">Loading Nexus Smart Wallet...</p>
                                <p className="text-sm text-slate-400 mt-2">Initializing secure storage</p>
                            </div>
                        </div>
                    }
                    persistor={persistor}
                >
                    <WagmiProvider config={config}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider>
                                <ErrorBoundary>
                                    <MainLayout/>
                                </ErrorBoundary>
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                </PersistGate>
            </Provider>
        </ErrorBoundary>
    )
}

export default App
