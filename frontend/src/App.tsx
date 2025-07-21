// frontend/src/App.tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {Config, WagmiProvider} from 'wagmi'
import {RainbowKitProvider} from '@rainbow-me/rainbowkit'
import {Provider} from 'react-redux'
import {PersistGate} from 'redux-persist/integration/react'
import {config} from './config/wagmi'
import {store, persistor} from './store/store'
import {MainLayout} from './components/layout/MainLayout'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider>
                            <MainLayout/>
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </PersistGate>
        </Provider>
    )
}

export default App
