import React, {useState} from 'react';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useAccount, useDisconnect} from 'wagmi';
import {EmailWalletConnect} from './EmailWalletConnect';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';

type WalletType = 'metamask' | 'email' | null;

export const WalletTypeSelector: React.FC = () => {
    const [selectedWalletType, setSelectedWalletType] = useState<WalletType>(null);
    const {isConnected} = useAccount();
    const {disconnect} = useDisconnect();

    const handleWalletTypeSelect = (type: WalletType) => {
        // If switching from MetaMask to email, disconnect MetaMask first
        if (isConnected && type === 'email') {
            disconnect();
        }
        setSelectedWalletType(type);
    };

    const handleBack = () => {
        if (isConnected) {
            disconnect();
        }
        setSelectedWalletType(null);
    };

    // If no wallet type selected, show selection screen
    if (!selectedWalletType) {
        return (
            <div className="text-center py-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        Welcome to Nexus Smart Wallet
                    </h2>
                    <p className="text-slate-300 mb-6">
                        Choose how you'd like to connect and create your smart account
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    {/* MetaMask Option */}
                    <Card className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => handleWalletTypeSelect('metamask')}>
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                🦊
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Connect with MetaMask
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Use your existing MetaMask wallet to create a smart account
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                    <span>✓ Familiar MetaMask experience</span>
                                    <span>✓ Direct wallet control</span>
                                </div>
                            </div>
                            <div className="text-slate-400">→</div>
                        </div>
                    </Card>

                    {/* Email Option */}
                    <Card className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => handleWalletTypeSelect('email')}>
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                📧
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    Connect with Email
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    Create a smart account using just your email address
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                    <span>✓ No MetaMask required</span>
                                    <span>✓ Backend-powered features</span>
                                </div>
                            </div>
                            <div className="text-slate-400">→</div>
                        </div>
                    </Card>
                </div>

                <div className="mt-8 space-y-2 text-center">
                    <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            ERC-4337 Smart Accounts
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                            Gasless Transactions
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                            Account Abstraction
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show MetaMask connection flow
    if (selectedWalletType === 'metamask') {
        return (
            <div className="text-center py-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto mb-8">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        🦊
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        Connect with MetaMask
                    </h2>
                    <p className="text-slate-300 mb-6">
                        Connect your MetaMask wallet to create and manage your smart account
                    </p>

                    <div className="space-y-4">
                        <ConnectButton.Custom>
                            {({
                                  account,
                                  chain,
                                  openAccountModal,
                                  openChainModal,
                                  openConnectModal,
                                  authenticationStatus,
                                  mounted,
                              }) => {
                                const ready = mounted && authenticationStatus !== 'loading';
                                const connected = ready && account && chain;

                                return (
                                    <div
                                        {...(!ready && {
                                            'aria-hidden': true,
                                            style: {
                                                opacity: 0,
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                            },
                                        })}
                                    >
                                        {(() => {
                                            if (!connected) {
                                                return (
                                                    <Button onClick={openConnectModal} className="w-full">
                                                        Connect MetaMask
                                                    </Button>
                                                );
                                            }

                                            if (chain.unsupported) {
                                                return (
                                                    <Button onClick={openChainModal} variant="outline"
                                                            className="w-full">
                                                        Wrong network
                                                    </Button>
                                                );
                                            }

                                            return (
                                                <div className="space-y-4">
                                                    <div
                                                        className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                                                        <div
                                                            className="flex items-center space-x-2 text-green-400 mb-2">
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            <span
                                                                className="text-sm font-medium">MetaMask Connected</span>
                                                        </div>
                                                        <div className="text-sm text-slate-300">
                                                            <div>Account: {account.displayName}</div>
                                                            <div>Network: {chain.name}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <Button
                                                            onClick={openAccountModal}
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            Account
                                                        </Button>
                                                        <Button
                                                            onClick={openChainModal}
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            Network
                                                        </Button>
                                                    </div>

                                                    <p className="text-xs text-slate-400 mt-4">
                                                        Your MetaMask wallet is connected. You can now use smart account
                                                        features.
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            }}
                        </ConnectButton.Custom>
                    </div>
                </div>

                <Button
                    onClick={handleBack}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                >
                    ← Back to wallet selection
                </Button>
            </div>
        );
    }

    // Show Email connection flow
    if (selectedWalletType === 'email') {
        return (
            <div>
                <div className="text-center mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto mb-6">
                        <div
                            className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            📧
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">
                            Connect with Email
                        </h2>
                        <p className="text-slate-300 text-sm">
                            Enter your email to create a smart account with backend-powered features
                        </p>
                    </div>
                </div>

                <EmailWalletConnect/>

                <div className="text-center mt-6">
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        size="sm"
                    >
                        ← Back to wallet selection
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};
