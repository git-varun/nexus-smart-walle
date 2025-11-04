import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {LoginForm} from './LoginForm';
import {RegisterForm} from './RegisterForm';
import {WalletTypeSelector} from '../wallet/WalletTypeSelector';

type AuthMode = 'login' | 'register' | 'wallet-select';

interface AuthenticationPageProps {
    onAuthSuccess: (userData: { user: any; token: string }) => void;
}

export const AuthenticationPage: React.FC<AuthenticationPageProps> = ({onAuthSuccess}) => {
    const [authMode, setAuthMode] = useState<AuthMode>('wallet-select');

    const handleAuthSuccess = (userData: { user: any; token: string }) => {
        onAuthSuccess(userData);
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute top-1/4 left-1/4 w-64 h-64 bg-web3-primary/10 rounded-full blur-3xl animate-pulse-slow"/>
                <div
                    className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-web3-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-1000"/>
                <div
                    className="absolute top-3/4 left-1/2 w-32 h-32 bg-web3-accent/10 rounded-full blur-2xl animate-pulse-slow delay-2000"/>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <motion.div
                    initial={{opacity: 0, y: -30}}
                    animate={{opacity: 1, y: 0}}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div
                            className="w-12 h-12 bg-gradient-to-r from-web3-primary to-web3-secondary rounded-xl flex items-center justify-center shadow-neon">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white">
                            Nexus
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg">
                        Your Gateway to Web3 Smart Accounts
                    </p>
                    <div className="mt-2 text-sm text-slate-500">
                        Powered by ERC-4337 Account Abstraction
                    </div>
                </motion.div>

                {/* Auth Forms */}
                <div className="relative">
                    {authMode === 'wallet-select' ? (
                        <WalletTypeSelector
                            onEmailLogin={() => setAuthMode('login')}
                            onMetaMaskSuccess={handleAuthSuccess}
                        />
                    ) : authMode === 'login' ? (
                        <div>
                            <LoginForm
                                onSuccess={handleAuthSuccess}
                                onSwitchToRegister={() => setAuthMode('register')}
                            />
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setAuthMode('wallet-select')}
                                    className="text-slate-400 hover:text-slate-300 text-sm underline"
                                >
                                    ← Back to connection options
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <RegisterForm
                                onSuccess={handleAuthSuccess}
                                onSwitchToLogin={() => setAuthMode('login')}
                            />
                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setAuthMode('wallet-select')}
                                    className="text-slate-400 hover:text-slate-300 text-sm underline"
                                >
                                    ← Back to connection options
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features Preview */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.6}}
                    className="mt-12 text-center"
                >
                    <div className="text-slate-400 text-sm mb-4">What you'll get with Nexus:</div>
                    <div className="flex flex-wrap justify-center gap-4 text-xs">
                        <div
                            className="flex items-center gap-1 bg-card/30 backdrop-blur-sm rounded-full px-3 py-1 border border-border">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-slate-300">Smart Accounts</span>
                        </div>
                        <div
                            className="flex items-center gap-1 bg-card/30 backdrop-blur-sm rounded-full px-3 py-1 border border-border">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-slate-300">Multi-Chain Support</span>
                        </div>
                        <div
                            className="flex items-center gap-1 bg-card/30 backdrop-blur-sm rounded-full px-3 py-1 border border-border">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-slate-300">Gas Optimization</span>
                        </div>
                        <div
                            className="flex items-center gap-1 bg-card/30 backdrop-blur-sm rounded-full px-3 py-1 border border-border">
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-slate-300">Session Keys</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};