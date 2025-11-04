import React, {useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card} from './Card';
import {Button} from './Button';
import {cn} from '../../utils/cn';
import {ACCOUNT_TYPES, getAccountTypeById} from '../../config/accountTypes';

interface AccountTypeSelectorProps {
    selectedAccountType: string;
    onAccountTypeSelect: (accountTypeId: string) => void;
    selectedChainId?: number;
    showProviderFilter?: boolean;
    showComplexityFilter?: boolean;
    compact?: boolean;
    className?: string;
}

type ProviderFilter = 'all' | 'alchemy' | 'kernel' | 'biconomy';
type ComplexityFilter = 'all' | 'simple' | 'intermediate' | 'advanced';

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({
                                                                            selectedAccountType,
                                                                            onAccountTypeSelect,
                                                                            selectedChainId,
                                                                            showProviderFilter = true,
                                                                            showComplexityFilter = true,
                                                                            compact = false,
                                                                            className
                                                                        }) => {
    const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
    const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>('all');
    const [expandedAccountType, setExpandedAccountType] = useState<string | null>(null);

    const selectedAccount = getAccountTypeById(selectedAccountType);

    // Filter account types based on selected filters and chain compatibility
    const filteredAccountTypes = useMemo(() => {
        let types = Object.values(ACCOUNT_TYPES);

        // Filter by chain compatibility
        if (selectedChainId) {
            types = types.filter(type => type.supportedChains.includes(selectedChainId));
        }

        // Filter by provider
        if (providerFilter !== 'all') {
            types = types.filter(type => type.provider === providerFilter);
        }

        // Filter by complexity
        if (complexityFilter !== 'all') {
            types = types.filter(type => type.complexity === complexityFilter);
        }

        // Sort by recommended first, then popular, then alphabetically
        return types.sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            return a.displayName.localeCompare(b.displayName);
        });
    }, [selectedChainId, providerFilter, complexityFilter]);

    const handleAccountTypeSelect = (accountTypeId: string) => {
        onAccountTypeSelect(accountTypeId);
        setExpandedAccountType(null);
    };

    const toggleExpanded = (accountTypeId: string) => {
        setExpandedAccountType(expandedAccountType === accountTypeId ? null : accountTypeId);
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'alchemy':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'kernel':
                return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'biconomy':
                return 'text-green-400 bg-green-500/10 border-green-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'simple':
                return 'text-green-400';
            case 'intermediate':
                return 'text-yellow-400';
            case 'advanced':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getDeploymentCostColor = (cost: string) => {
        switch (cost) {
            case 'low':
                return 'text-green-400';
            case 'medium':
                return 'text-yellow-400';
            case 'high':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Filter Controls */}
            {(showProviderFilter || showComplexityFilter) && (
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4">
                        {showProviderFilter && (
                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Provider
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['all', 'alchemy', 'kernel', 'biconomy'] as ProviderFilter[]).map((provider) => (
                                        <button
                                            key={provider}
                                            onClick={() => setProviderFilter(provider)}
                                            className={cn(
                                                'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                                                providerFilter === provider
                                                    ? 'bg-web3-primary text-white'
                                                    : 'bg-card/50 text-muted-foreground hover:bg-web3-primary/20'
                                            )}
                                        >
                                            {provider}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {showComplexityFilter && (
                            <div className="flex-1 min-w-48">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Complexity
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['all', 'simple', 'intermediate', 'advanced'] as ComplexityFilter[]).map((complexity) => (
                                        <button
                                            key={complexity}
                                            onClick={() => setComplexityFilter(complexity)}
                                            className={cn(
                                                'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                                                complexityFilter === complexity
                                                    ? 'bg-web3-primary text-white'
                                                    : 'bg-card/50 text-muted-foreground hover:bg-web3-primary/20'
                                            )}
                                        >
                                            {complexity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Debug Info */}
            <div className="text-xs text-muted-foreground mb-4">
                Debug: Found {filteredAccountTypes.length} account types for chain {selectedChainId}
            </div>

            {/* Account Type List */}
            <div className={compact ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredAccountTypes.length === 0 ? (
                    <Card className="p-6 text-center">
                        <div className="text-muted-foreground">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.901-6.06 2.37l-.71-.71A9 9 0 0112 13.5c3.314 0 6.293 1.79 7.91 4.5-.39.39-.8.76-1.24 1.11z"/>
                            </svg>
                            <p className="text-sm">No account types available for the selected filters</p>
                            <p className="text-xs mt-1">Try adjusting your provider or complexity filters</p>
                        </div>
                    </Card>
                ) : (
                    filteredAccountTypes.map((accountType) => (
                        <motion.div
                            key={accountType.id}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                        >
                            <Card
                                className={cn(
                                    compact ? 'p-3 transition-all duration-300 cursor-pointer' : 'p-4 transition-all duration-300 cursor-pointer',
                                    selectedAccountType === accountType.id
                                        ? 'border-web3-primary bg-web3-primary/10 shadow-neon'
                                        : 'hover:border-web3-primary/50 hover:bg-web3-primary/5'
                                )}
                            >
                                <div
                                    className="flex items-start justify-between"
                                    onClick={() => handleAccountTypeSelect(accountType.id)}
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="text-3xl">{accountType.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-foreground">{accountType.displayName}</h3>
                                                {accountType.recommended && (
                                                    <span
                                                        className="text-xs bg-web3-accent/20 text-web3-accent px-2 py-0.5 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                                {accountType.popular && (
                                                    <span
                                                        className="text-xs bg-web3-secondary/20 text-web3-secondary px-2 py-0.5 rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                                {accountType.gasOptimized && (
                                                    <span
                                                        className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                                        Gas Optimized
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">{accountType.description}</p>

                                            <div className="flex items-center gap-4 text-xs">
                                                <div
                                                    className={cn('px-2 py-1 rounded border', getProviderColor(accountType.provider))}>
                                                    {accountType.provider.charAt(0).toUpperCase() + accountType.provider.slice(1)}
                                                    {accountType.version && ` ${accountType.version}`}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Complexity:</span>
                                                    <span className={getComplexityColor(accountType.complexity)}>
                                                        {accountType.complexity}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Deploy Cost:</span>
                                                    <span
                                                        className={getDeploymentCostColor(accountType.deploymentCost)}>
                                                        {accountType.deploymentCost}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!compact && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpanded(accountType.id);
                                                }}
                                                className="text-muted-foreground hover:text-web3-primary"
                                            >
                                                <svg
                                                    className={cn(
                                                        'w-4 h-4 transition-transform',
                                                        expandedAccountType === accountType.id && 'rotate-180'
                                                    )}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M19 9l-7 7-7-7"/>
                                                </svg>
                                            </Button>
                                        )}

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
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {!compact && expandedAccountType === accountType.id && (
                                        <motion.div
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                            className="mt-4 pt-4 border-t border-border"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Features */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-2">Features</h4>
                                                    <div className="space-y-2">
                                                        {accountType.features.map((feature, index) => (
                                                            <div key={index}
                                                                 className="flex items-center gap-2 text-sm">
                                                                <div className={cn(
                                                                    'w-4 h-4 rounded-full flex items-center justify-center text-xs',
                                                                    feature.supported
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-gray-500/20 text-gray-400'
                                                                )}>
                                                                    {feature.supported ? '✓' : '×'}
                                                                </div>
                                                                <span
                                                                    className={feature.supported ? 'text-foreground' : 'text-muted-foreground'}>
                                                                    {feature.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Supported Chains */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-2">Supported
                                                        Chains</h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>{accountType.supportedChains.length} networks supported</p>
                                                        {selectedChainId && accountType.supportedChains.includes(selectedChainId) && (
                                                            <p className="text-green-400 mt-1">✓ Compatible with
                                                                selected network</p>
                                                        )}
                                                        {accountType.documentation && (
                                                            <a
                                                                href={accountType.documentation}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-web3-primary hover:underline mt-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                View Documentation
                                                                <svg className="w-3 h-3" fill="none"
                                                                     stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          strokeWidth={2}
                                                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                                                </svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {filteredAccountTypes.length > 0 && (
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div className="text-sm">
                            <p className="font-medium text-blue-400 mb-1">Account Type Selection</p>
                            <p className="text-blue-300">
                                Choose the smart account implementation that best fits your needs.
                                Each type offers different features and is optimized for specific use cases.
                            </p>
                            {selectedAccount && (
                                <p className="text-blue-300 mt-2">
                                    Selected: <strong>{selectedAccount.displayName}</strong> - {selectedAccount.description}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};