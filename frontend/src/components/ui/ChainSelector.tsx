import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {cn} from '@/utils/cn.ts';
import {type ChainConfig, getChainById, getMainnetChains, getPopularChains, SUPPORTED_CHAINS} from '@/config/chains.ts';

interface ChainSelectorProps {
    selectedChainId: number;
    onChainSelect: (chainId: number) => void;
    label?: string;
    showTestnets?: boolean;
    popularOnly?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
                                                                selectedChainId,
                                                                onChainSelect,
                                                                label = 'Select Chain',
                                                                showTestnets = true,
                                                                popularOnly = false,
                                                                className,
                                                                size = 'md'
                                                            }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showTestnetToggle, setShowTestnetToggle] = useState(showTestnets);

    const selectedChain = getChainById(selectedChainId);

    // Get filtered chains based on props
    const getAvailableChains = (): ChainConfig[] => {
        if (popularOnly) {
            return getPopularChains().filter(chain => showTestnetToggle || !chain.testnet);
        }

        if (showTestnetToggle) {
            return Object.values(SUPPORTED_CHAINS);
        }

        return getMainnetChains();
    };

    const availableChains = getAvailableChains();
    const mainnetChains = availableChains.filter(chain => !chain.testnet);
    const testnetChains = availableChains.filter(chain => chain.testnet);

    const sizeClasses = {
        sm: 'text-sm p-2',
        md: 'text-sm p-3',
        lg: 'text-base p-4'
    };

    const handleChainSelect = (chainId: number) => {
        onChainSelect(chainId);
        setIsOpen(false);
    };

    return (
        <div className={cn('relative', className)}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}

            {/* Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'web3-input font-jakarta transition-all duration-300 w-full flex items-center justify-between',
                    'bg-card/50 backdrop-blur-sm border border-border hover:border-web3-primary',
                    'focus:border-web3-primary focus:shadow-neon focus:outline-none',
                    sizeClasses[size]
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                        {selectedChain?.logo ? (
                            <selectedChain.logo
                                chainId={selectedChainId}
                                symbol={selectedChain.symbol}
                                size={24}
                            />
                        ) : (
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">?</span>
                            </div>
                        )}
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-foreground">
                            {selectedChain?.displayName || 'Select Chain'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {selectedChain?.testnet ? 'Testnet' : 'Mainnet'} • {selectedChain?.symbol}
                        </div>
                    </div>
                </div>
                <svg
                    className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <motion.div
                    initial={{opacity: 0, y: -10, scale: 0.95}}
                    animate={{opacity: 1, y: 0, scale: 1}}
                    exit={{opacity: 0, y: -10, scale: 0.95}}
                    className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl z-[9999] max-h-96 overflow-y-auto"
                >
                    {/* Testnet Toggle */}
                    {showTestnets && (
                        <div className="p-3 border-b border-border">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={showTestnetToggle}
                                    onChange={(e) => setShowTestnetToggle(e.target.checked)}
                                    className="w-4 h-4 text-web3-primary focus:ring-web3-primary border-gray-300 rounded"
                                />
                                <span className="text-muted-foreground">Show testnets</span>
                            </label>
                        </div>
                    )}

                    {/* Mainnet Chains */}
                    {mainnetChains.length > 0 && (
                        <div className="p-2">
                            <div
                                className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                Mainnet
                            </div>
                            {mainnetChains.map((chain) => (
                                <button
                                    key={chain.chainId}
                                    onClick={() => handleChainSelect(chain.chainId)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                                        'hover:bg-web3-primary/10 hover:text-web3-primary',
                                        selectedChainId === chain.chainId
                                            ? 'bg-web3-primary/20 text-web3-primary border border-web3-primary/30'
                                            : 'text-foreground'
                                    )}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <chain.logo
                                            chainId={chain.chainId}
                                            symbol={chain.symbol}
                                            size={20}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{chain.displayName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Chain ID: {chain.chainId} • {chain.symbol}
                                        </div>
                                    </div>
                                    {selectedChainId === chain.chainId && (
                                        <svg className="w-5 h-5 text-web3-primary" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M5 13l4 4L19 7"/>
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Testnet Chains */}
                    {showTestnetToggle && testnetChains.length > 0 && (
                        <div className="p-2 border-t border-border">
                            <div
                                className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                                Testnet
                            </div>
                            {testnetChains.map((chain) => (
                                <button
                                    key={chain.chainId}
                                    onClick={() => handleChainSelect(chain.chainId)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                                        'hover:bg-web3-primary/10 hover:text-web3-primary',
                                        selectedChainId === chain.chainId
                                            ? 'bg-web3-primary/20 text-web3-primary border border-web3-primary/30'
                                            : 'text-foreground'
                                    )}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <chain.logo
                                            chainId={chain.chainId}
                                            symbol={chain.symbol}
                                            size={20}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{chain.displayName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Chain ID: {chain.chainId} • {chain.symbol}
                                        </div>
                                    </div>
                                    {selectedChainId === chain.chainId && (
                                        <svg className="w-5 h-5 text-web3-primary" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M5 13l4 4L19 7"/>
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-3 border-t border-border text-center">
                        <div className="text-xs text-muted-foreground">
                            {availableChains.length} chains available
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};