import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {ChainSelector} from '../ui/ChainSelector';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';
import {apiClient} from '@/services/apiClient.ts';
import {DEFAULT_CHAIN_ID, getChainById} from '@/config/chains.ts';
import {DEFAULT_ACCOUNT_TYPE, getAccountTypeById} from '@/config/accountTypes.ts';
import {cn} from '@/utils/cn.ts';

type SignerType = 'central' | 'walletconnect';

interface AccountCreationProps {
    onAccountCreated?: () => void;
    showExisting?: boolean;
}

export const AccountCreation: React.FC<AccountCreationProps> = ({
                                                                    onAccountCreated,
                                                                    showExisting = false
                                                                }) => {
    const [selectedSigner, setSelectedSigner] = useState<SignerType>('central');
    const [selectedAccountType, setSelectedAccountType] = useState<string>(DEFAULT_ACCOUNT_TYPE);
    const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletConnectFailed, setWalletConnectFailed] = useState(false);

    const {token, user} = useBackendSmartAccount();

    const signerOptions = [
        {
            id: 'central' as SignerType,
            name: 'Central Wallet',
            description: 'Managed by our secure infrastructure',
            icon: '🏛️',
            features: ['Gas sponsored', 'Session keys', 'Easy recovery'],
            recommended: true
        },
        {
            id: 'walletconnect' as SignerType,
            name: 'WalletConnect',
            description: 'Connect your existing wallet',
            icon: '🔗',
            features: ['Your keys', 'Full control', 'MetaMask support'],
            recommended: false
        }
    ];


    const handleCreateAccount = async () => {
        if (!token) {
            setError('Authentication token not available');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            if (selectedSigner === 'walletconnect') {
                // WalletConnect chain switching logic
                const selectedChain = getChainById(selectedChainId);

                try {
                    console.log('Requesting WalletConnect to switch to chain:', selectedChain?.displayName);

                    // In a real implementation, this would use WalletConnect to switch chains
                    // For now, we'll simulate the process with potential failure
                    const shouldFail = Math.random() < 0.2; // 20% chance of failure for demo

                    if (shouldFail) {
                        setWalletConnectFailed(true);
                        throw new Error(`Failed to switch to ${selectedChain?.displayName}. Please switch manually in your wallet.`);
                    }

                    // Simulate network switching delay
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    console.log('✅ WalletConnect switched to chain:', selectedChainId);

                } catch (chainSwitchError) {
                    console.error('Chain switch failed:', chainSwitchError);
                    setWalletConnectFailed(true);
                    throw chainSwitchError;
                }
            }

            // Create the smart account with selected chain and account type
            const selectedChain = getChainById(selectedChainId);
            const selectedAccount = getAccountTypeById(selectedAccountType);
            console.log('Creating account:', {
                chain: selectedChain?.displayName,
                chainId: selectedChainId,
                accountType: selectedAccount?.displayName,
                accountTypeId: selectedAccountType
            });
            const response = await apiClient.createSmartAccount(token, selectedChainId, selectedAccountType);

            if (response.success && response.data) {
                console.log('✅ Smart account created:', response.data.smartAccount);
                onAccountCreated?.();
            } else {
                throw new Error(response.error?.message || 'Failed to create account');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Account creation failed';
            setError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleWalletConnectFallback = () => {
        setSelectedSigner('central');
        setWalletConnectFailed(false);
        setError(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
            >
                <h1 className="text-3xl font-bold text-foreground">
                    {showExisting ? 'Create New Account' : 'Setup Your Smart Account'}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {showExisting
                        ? 'Add another smart account with different settings'
                        : 'Let\'s create your first smart account to get started'
                    }
                </p>
            </motion.div>

            {!showExisting && (
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.1}}
                >
                    <Card
                        className="p-6 bg-gradient-to-r from-web3-primary/10 to-web3-secondary/10 border-web3-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-web3-primary/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-web3-primary" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground mb-2">What are Smart Accounts?</h2>
                                <p className="text-muted-foreground text-sm mb-3">
                                    Smart accounts are programmable Ethereum accounts that offer enhanced security,
                                    gas sponsorship, and advanced features like session keys for automated transactions.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1 bg-card/50 px-2 py-1 rounded text-xs">
                                        <span className="text-green-500">✓</span>
                                        <span>Sponsored gas fees</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-card/50 px-2 py-1 rounded text-xs">
                                        <span className="text-green-500">✓</span>
                                        <span>Session-based automation</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-card/50 px-2 py-1 rounded text-xs">
                                        <span className="text-green-500">✓</span>
                                        <span>Social recovery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Signer Selection */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
            >
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Choose Your Signer</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        Select how you want to sign transactions with your smart account
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {signerOptions.map((signer) => (
                            <motion.button
                                key={signer.id}
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                onClick={() => setSelectedSigner(signer.id)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                    selectedSigner === signer.id
                                        ? 'border-web3-primary bg-web3-primary/10'
                                        : 'border-border hover:border-web3-primary/50'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{signer.icon}</span>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{signer.name}</h3>
                                            {signer.recommended && (
                                                <span
                                                    className="text-xs bg-web3-accent/20 text-web3-accent px-2 py-0.5 rounded-full">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        selectedSigner === signer.id
                                            ? 'border-web3-primary bg-web3-primary'
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSigner === signer.id && (
                                            <div className="w-2 h-2 bg-white rounded-full"/>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{signer.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {signer.features.map((feature, index) => (
                                        <span
                                            key={index}
                                            className="text-xs bg-card/50 px-2 py-1 rounded text-muted-foreground"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {walletConnectFailed && (
                        <motion.div
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"/>
                                </svg>
                                <div className="flex-1">
                                    <p className="font-medium text-red-400">WalletConnect Connection Failed</p>
                                    <p className="text-sm text-red-300 mt-1">
                                        Unable to connect with WalletConnect or switch
                                        to {getChainById(selectedChainId)?.displayName}.
                                        Please ensure your wallet supports this network or use Central Wallet.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleWalletConnectFallback}
                                        className="mt-3 border-web3-primary text-web3-primary hover:bg-web3-primary hover:text-white"
                                    >
                                        Use Central Wallet Instead
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </Card>
            </motion.div>

            {/* Chain Selection */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.3}}
            >
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Select Network</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        Choose the blockchain network for your smart account
                    </p>

                    <ChainSelector
                        selectedChainId={selectedChainId}
                        onChainSelect={setSelectedChainId}
                        label="Blockchain Network"
                        showTestnets={true}
                        popularOnly={false}
                        className="max-w-md"
                        size="md"
                    />

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div className="text-sm">
                                <p className="font-medium text-blue-400 mb-1">Network Selection</p>
                                <p className="text-blue-300">
                                    Your smart account will be deployed on {getChainById(selectedChainId)?.displayName}.
                                    You can create additional accounts on other networks later.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/*<motion.div*/}
            {/*    initial={{opacity: 0, y: 20}}*/}
            {/*    animate={{opacity: 1, y: 0}}*/}
            {/*    transition={{delay: 0.2, duration: 0.4}}*/}
            {/*    className="w-full"*/}
            {/*>*/}
            {/*    <Card className="p-6 w-full max-w-lg mx-auto">*/}
            {/*        /!* Header *!/*/}
            {/*        <h2 className="text-xl font-semibold text-foreground mb-2">Select Network</h2>*/}
            {/*        <p className="text-sm text-muted-foreground mb-4">*/}
            {/*            Choose the blockchain network for your smart account.*/}
            {/*        </p>*/}

            {/*        /!* Chain Selector *!/*/}
            {/*        <ChainSelector*/}
            {/*            selectedChainId={selectedChainId}*/}
            {/*            onChainSelect={setSelectedChainId}*/}
            {/*            label="Blockchain Network"*/}
            {/*            showTestnets={true}*/}
            {/*            popularOnly={false}*/}
            {/*            className="w-full"*/}
            {/*            size="md"*/}
            {/*        />*/}

            {/*        /!* Info Box *!/*/}
            {/*        <div*/}
            {/*            className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">*/}
            {/*            <svg*/}
            {/*                className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"*/}
            {/*                fill="none"*/}
            {/*                stroke="currentColor"*/}
            {/*                viewBox="0 0 24 24"*/}
            {/*            >*/}
            {/*                <path*/}
            {/*                    strokeLinecap="round"*/}
            {/*                    strokeLinejoin="round"*/}
            {/*                    strokeWidth={2}*/}
            {/*                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"*/}
            {/*                />*/}
            {/*            </svg>*/}
            {/*            <div className="text-sm">*/}
            {/*                <p className="font-medium text-blue-400 mb-1">Network Selection</p>*/}
            {/*                <p className="text-blue-300">*/}
            {/*                    Your smart account will be deployed on{" "}*/}
            {/*                    <span className="font-semibold">*/}
            {/*    /!*{selectedChainId?.displayName || "Unknown Network"}*!/*/}
            {/*  </span>*/}
            {/*                    . You can create additional accounts on other networks later.*/}
            {/*                </p>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </Card>*/}
            {/*</motion.div>*/}

            {/* Account Type Selection */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.4}}
            >
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Select Account Type</h2>
                    <p className="text-muted-foreground text-sm mb-6">
                        Choose the smart account implementation that best fits your needs
                    </p>

                    {/* Account Type Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[
                            {
                                id: 'alchemy-light-v2',
                                name: 'Light Account v2',
                                description: 'Lightweight and gas-efficient',
                                icon: '⚡',
                                recommended: true,
                                provider: 'Alchemy'
                            },
                            {
                                id: 'alchemy-multiowner',
                                name: 'Multi-Owner Light Account',
                                description: 'Light account with multiple owner support',
                                icon: '👥',
                                recommended: false,
                                provider: 'Alchemy'
                            },
                            {
                                id: 'kernel-v3',
                                name: 'Kernel v3',
                                description: 'Latest Kernel version with improved efficiency',
                                icon: '⚙️',
                                recommended: true,
                                provider: 'Kernel'
                            },
                            {
                                id: 'biconomy-v2',
                                name: 'Biconomy v2',
                                description: 'Multi-chain compatible smart account',
                                icon: '🌊',
                                recommended: false,
                                provider: 'Biconomy'
                            }
                        ].map((accountType) => (
                            <motion.div
                                key={accountType.id}
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                            >
                                <Card
                                    className={cn(
                                        'p-4 cursor-pointer transition-all duration-300 relative overflow-hidden',
                                        selectedAccountType === accountType.id
                                            ? 'border-web3-primary bg-gradient-to-br from-web3-primary/10 via-web3-primary/5 to-web3-secondary/10 shadow-neon ring-1 ring-web3-primary/30'
                                            : 'border-border hover:border-web3-primary/50 hover:bg-gradient-to-br hover:from-web3-primary/5 hover:to-web3-secondary/5 hover:shadow-lg'
                                    )}
                                    onClick={() => setSelectedAccountType(accountType.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="text-2xl">{accountType.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-foreground">{accountType.name}</h3>
                                                    {accountType.recommended && (
                                                        <span
                                                            className="text-xs bg-web3-accent/20 text-web3-accent px-2 py-0.5 rounded-full">
                                                            Recommended
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{accountType.description}</p>
                                                <div className="text-xs text-blue-400">{accountType.provider}</div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            selectedAccountType === accountType.id
                                                ? 'border-web3-primary bg-web3-primary'
                                                : 'border-gray-300'
                                        )}>
                                            {selectedAccountType === accountType.id && (
                                                <div className="w-2 h-2 bg-white rounded-full"/>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{opacity: 0, x: -10}}
                    animate={{opacity: 1, x: 0}}
                >
                    <Card className="p-4 bg-red-500/10 border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm">{error}</span>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Create Button */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.5}}
                className="flex justify-center"
            >
                <Button
                    onClick={handleCreateAccount}
                    variant="primary"
                    size="lg"
                    loading={isCreating}
                    glow={!isCreating}
                    className="px-12"
                >
                    {isCreating ? 'Creating Smart Account...' : 'Create Smart Account'}
                </Button>
            </motion.div>
        </div>
    );
};