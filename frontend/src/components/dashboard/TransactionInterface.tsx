import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {BundlerSelector} from '../ui/BundlerSelector';
import {PaymasterSelector} from '../ui/PaymasterSelector';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {useTransactionHistoryBackend} from '../../hooks/useTransactionHistoryBackend';
import {TransactionHistory} from './TransactionHistory';
import {formatEther, isAddress, parseEther} from 'viem';
import {DEFAULT_BUNDLER} from '../../config/bundlers';
import {DEFAULT_PAYMASTER} from '../../config/paymasters';
import {DEFAULT_CHAIN_ID} from '../../config/chains';

type TabType = 'simple' | 'advanced';

export const TransactionInterface: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('simple');
    const [showGasDetails, setShowGasDetails] = useState(false);
    const [showProviderSettings, setShowProviderSettings] = useState(false);

    // Provider selections
    const [selectedBundler, setSelectedBundler] = useState<string>(DEFAULT_BUNDLER);
    const [selectedPaymaster, setSelectedPaymaster] = useState<string>(DEFAULT_PAYMASTER);
    const [selectedChainId] = useState<number>(DEFAULT_CHAIN_ID); // This could be dynamic based on account

    // Simple tab form state
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    // Advanced tab form state
    const [toAddress, setToAddress] = useState('');
    const [value, setValue] = useState('');
    const [data, setData] = useState('0x');

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const {token} = useBackendSmartAccount();
    const {
        sendTransaction,
        estimateGas,
        gasEstimate,
        isLoading,
        isEstimating,
        transactions,
        fetchTransactionHistory,
        error
    } = useTransactionHistoryBackend();

    const tabs = [
        {
            id: 'simple' as TabType,
            label: 'Simple',
            description: 'Basic token transfers'
        },
        {
            id: 'advanced' as TabType,
            label: 'Advanced',
            description: 'Contract interactions'
        }
    ];

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (activeTab === 'simple') {
            if (!recipient) {
                errors.recipient = 'Recipient address is required';
            } else if (!isAddress(recipient)) {
                errors.recipient = 'Invalid Ethereum address';
            }

            if (!amount) {
                errors.amount = 'Amount is required';
            } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
                errors.amount = 'Amount must be a positive number';
            }
        } else {
            if (!toAddress) {
                errors.toAddress = 'Contract address is required';
            } else if (!isAddress(toAddress)) {
                errors.toAddress = 'Invalid Ethereum address';
            }

            if (!data || data === '0x') {
                errors.data = 'Contract data is required for advanced transactions';
            } else if (!data.startsWith('0x')) {
                errors.data = 'Data must be a valid hex string starting with 0x';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEstimateGas = async () => {
        if (!validateForm()) return;

        const txTo = activeTab === 'simple' ? recipient : toAddress;
        const txValue = activeTab === 'simple'
            ? (amount ? parseEther(amount) : BigInt(0))
            : (value ? parseEther(value) : BigInt(0));
        const txData = activeTab === 'simple' ? '0x' : data;

        await estimateGas(txTo as `0x${string}`, txData, txValue, 'alchemy');
    };

    const handleSendTransaction = async () => {
        if (!validateForm() || !token) return;

        const txTo = activeTab === 'simple' ? recipient : toAddress;
        const txValue = activeTab === 'simple'
            ? (amount ? parseEther(amount) : BigInt(0))
            : (value ? parseEther(value) : BigInt(0));
        const txData = activeTab === 'simple' ? '0x' : data;

        try {
            // Include provider selections in transaction
            console.log('Sending transaction with providers:', {
                bundler: selectedBundler,
                paymaster: selectedPaymaster,
                chainId: selectedChainId
            });

            await sendTransaction(
                token,
                txTo as `0x${string}`,
                txData,
                txValue,
                {bundler: selectedBundler, paymaster: selectedPaymaster, chainId: selectedChainId}
            );

            // Reset form on success
            if (activeTab === 'simple') {
                setRecipient('');
                setAmount('');
            } else {
                setToAddress('');
                setValue('');
                setData('0x');
            }
            setValidationErrors({});
        } catch (error) {
            console.error('Transaction failed:', error);
        }
    };

    // Mock ETH price for USD calculation (in real app, this would come from an API)
    const ethPriceUSD = 2500;
    const calculateUSDValue = (ethAmount: string): number => {
        try {
            return parseFloat(ethAmount) * ethPriceUSD;
        } catch {
            return 0;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Send Transaction</h1>
                        <p className="text-muted-foreground mt-2">
                            Transfer tokens or interact with smart contracts
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProviderSettings(!showProviderSettings)}
                        className="flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Provider Settings
                    </Button>
                </div>
            </motion.div>

            {/* Provider Settings */}
            {showProviderSettings && (
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    transition={{delay: 0.05}}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Transaction Providers</h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Choose your bundler and paymaster for optimal transaction processing
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowProviderSettings(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="6 18L18 6M6 6l12 12"/>
                                </svg>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Bundler Selection */}
                            <div>
                                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                                    </svg>
                                    Bundler Selection
                                </h3>
                                <BundlerSelector
                                    selectedBundler={selectedBundler}
                                    onBundlerSelect={setSelectedBundler}
                                    selectedChainId={selectedChainId}
                                    showReliabilityFilter={true}
                                />
                            </div>

                            {/* Paymaster Selection */}
                            <div>
                                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    Paymaster Selection
                                </h3>
                                <PaymasterSelector
                                    selectedPaymaster={selectedPaymaster}
                                    onPaymasterSelect={setSelectedPaymaster}
                                    selectedChainId={selectedChainId}
                                    showSponsorshipFilter={true}
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Transaction Form */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
            >
                <Card className="p-6">
                    {/* Tab Headers */}
                    <div className="flex space-x-1 mb-6 bg-card/50 p-1 rounded-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setValidationErrors({});
                                }}
                                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-web3-primary text-white shadow-md'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/70'
                                }`}
                            >
                                <div>
                                    <div className="font-semibold">{tab.label}</div>
                                    <div className="text-xs opacity-80">{tab.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Simple Tab */}
                    {activeTab === 'simple' && (
                        <motion.div
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Recipient Address"
                                    placeholder="0x..."
                                    value={recipient}
                                    onChange={(e) => {
                                        setRecipient(e.target.value);
                                        if (validationErrors.recipient) {
                                            setValidationErrors(prev => ({...prev, recipient: ''}));
                                        }
                                    }}
                                    error={validationErrors.recipient}
                                    variant="cyber"
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                    }
                                />

                                <Input
                                    label="Amount (ETH)"
                                    placeholder="0.1"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (validationErrors.amount) {
                                            setValidationErrors(prev => ({...prev, amount: ''}));
                                        }
                                    }}
                                    error={validationErrors.amount}
                                    variant="cyber"
                                    helperText={amount ? `≈ $${calculateUSDValue(amount).toFixed(2)} USD` : undefined}
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                        </svg>
                                    }
                                />
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span className="text-blue-800 font-medium text-sm">Simple Transfer</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    This will send ETH directly to the recipient address. Gas fees will be sponsored by
                                    the paymaster.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Advanced Tab */}
                    {activeTab === 'advanced' && (
                        <motion.div
                            initial={{opacity: 0, x: 20}}
                            animate={{opacity: 1, x: 0}}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Contract Address"
                                    placeholder="0x..."
                                    value={toAddress}
                                    onChange={(e) => {
                                        setToAddress(e.target.value);
                                        if (validationErrors.toAddress) {
                                            setValidationErrors(prev => ({...prev, toAddress: ''}));
                                        }
                                    }}
                                    error={validationErrors.toAddress}
                                    variant="cyber"
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    }
                                />

                                <Input
                                    label="Value (ETH, optional)"
                                    placeholder="0.0"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    variant="cyber"
                                    helperText={value ? `≈ $${calculateUSDValue(value).toFixed(2)} USD` : 'Leave empty for view/pure functions'}
                                    leftIcon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                        </svg>
                                    }
                                />
                            </div>

                            <Input
                                label="Contract Data"
                                placeholder="0x..."
                                value={data}
                                onChange={(e) => {
                                    setData(e.target.value);
                                    if (validationErrors.data) {
                                        setValidationErrors(prev => ({...prev, data: ''}));
                                    }
                                }}
                                error={validationErrors.data}
                                variant="cyber"
                                helperText="ABI-encoded function call data"
                                leftIcon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                                    </svg>
                                }
                            />

                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                    </svg>
                                    <span className="text-yellow-800 font-medium text-sm">Advanced Mode</span>
                                </div>
                                <p className="text-yellow-700 text-sm">
                                    This allows direct smart contract interactions. Make sure you understand the
                                    function you're calling.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Gas Estimation */}
                    <div className="mt-8 p-4 bg-slate-50 border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-medium text-foreground">Gas Estimation</h3>
                                <p className="text-sm text-muted-foreground">
                                    Estimate transaction costs before sending
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEstimateGas}
                                loading={isEstimating}
                                disabled={!validateForm()}
                            >
                                Estimate Gas
                            </Button>
                        </div>

                        {gasEstimate && (
                            <motion.div
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                className="space-y-3"
                            >
                                {/* Prominent cost display */}
                                <div className="flex items-center justify-between p-3 bg-web3-primary/10 rounded-lg">
                                    <span className="text-foreground font-medium">Estimated Cost:</span>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-web3-primary">
                                            {formatEther(BigInt(gasEstimate.gasEstimate))} ETH
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            ≈
                                            ${(parseFloat(formatEther(BigInt(gasEstimate.gasEstimate))) * ethPriceUSD).toFixed(2)} USD
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable technical details */}
                                <button
                                    onClick={() => setShowGasDetails(!showGasDetails)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <svg className={`w-4 h-4 transition-transform ${showGasDetails ? 'rotate-90' : ''}`}
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="9 5l7 7-7 7"/>
                                    </svg>
                                    Show Details
                                </button>

                                {showGasDetails && (
                                    <motion.div
                                        initial={{opacity: 0, height: 0}}
                                        animate={{opacity: 1, height: 'auto'}}
                                        exit={{opacity: 0, height: 0}}
                                        className="space-y-2 text-sm bg-card/50 p-3 rounded border"
                                    >
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gas Limit:</span>
                                            <span className="font-mono">{gasEstimate.gasEstimate}</span>
                                        </div>
                                        {gasEstimate.maxFeePerGas && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Max Fee Per Gas:</span>
                                                <span className="font-mono">{gasEstimate.maxFeePerGas} wei</span>
                                            </div>
                                        )}
                                        {gasEstimate.maxPriorityFeePerGas && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Priority Fee:</span>
                                                <span
                                                    className="font-mono">{gasEstimate.maxPriorityFeePerGas} wei</span>
                                            </div>
                                        )}
                                        <div className="pt-2 mt-2 border-t text-xs text-blue-600">
                                            💡 Gas fees will be sponsored
                                            by {selectedPaymaster.charAt(0).toUpperCase() + selectedPaymaster.slice(1)} paymaster
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            📡 Transaction will be processed
                                            via {selectedBundler.charAt(0).toUpperCase() + selectedBundler.slice(1)} bundler
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <div className="flex items-center gap-2 text-red-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm">{error}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Send Button */}
                    <div className="flex justify-center mt-8">
                        <Button
                            onClick={handleSendTransaction}
                            variant="primary"
                            size="lg"
                            loading={isLoading}
                            disabled={!validateForm()}
                            glow={!isLoading && validateForm()}
                            className="px-12"
                        >
                            {isLoading ? 'Sending Transaction...' : 'Send Transaction'}
                        </Button>
                    </div>
                </Card>
            </motion.div>

            {/* Transaction History */}
            <TransactionHistory/>
        </div>
    );
};