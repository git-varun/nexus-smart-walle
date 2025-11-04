import React, {useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card} from './Card';
import {Button} from './Button';
import {cn} from '../../utils/cn';
import {getPaymasterById, PAYMASTER_PROVIDERS} from '../../config/paymasters';

interface PaymasterSelectorProps {
    selectedPaymaster: string;
    onPaymasterSelect: (paymasterId: string) => void;
    selectedChainId?: number;
    showSponsorshipFilter?: boolean;
    className?: string;
}

type SponsorshipFilter = 'all' | 'full' | 'partial' | 'conditional';

export const PaymasterSelector: React.FC<PaymasterSelectorProps> = ({
                                                                        selectedPaymaster,
                                                                        onPaymasterSelect,
                                                                        selectedChainId,
                                                                        showSponsorshipFilter = true,
                                                                        className
                                                                    }) => {
    const [sponsorshipFilter, setSponsorshipFilter] = useState<SponsorshipFilter>('all');
    const [expandedPaymaster, setExpandedPaymaster] = useState<string | null>(null);

    const selectedPaymasterConfig = getPaymasterById(selectedPaymaster);

    // Filter paymasters based on selected filters and chain compatibility
    const filteredPaymasters = useMemo(() => {
        let paymasters = Object.values(PAYMASTER_PROVIDERS);

        // Filter by chain compatibility
        if (selectedChainId) {
            paymasters = paymasters.filter(paymaster => paymaster.supportedChains.includes(selectedChainId));
        }

        // Filter by sponsorship type
        if (sponsorshipFilter !== 'all') {
            paymasters = paymasters.filter(paymaster => paymaster.gasSponsorship === sponsorshipFilter);
        }

        // Sort by recommended first, then popular, then by reliability and name
        return paymasters.sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            if (a.popular && !b.popular) return -1;
            if (!a.popular && b.popular) return 1;
            if (a.reliability !== b.reliability) {
                const reliabilityOrder = {'high': 0, 'medium': 1, 'low': 2};
                return reliabilityOrder[a.reliability] - reliabilityOrder[b.reliability];
            }
            return a.displayName.localeCompare(b.displayName);
        });
    }, [selectedChainId, sponsorshipFilter]);

    const handlePaymasterSelect = (paymasterId: string) => {
        onPaymasterSelect(paymasterId);
        setExpandedPaymaster(null);
    };

    const toggleExpanded = (paymasterId: string) => {
        setExpandedPaymaster(expandedPaymaster === paymasterId ? null : paymasterId);
    };

    const getReliabilityColor = (reliability: string) => {
        switch (reliability) {
            case 'high':
                return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'medium':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'low':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getSponsorshipColor = (sponsorship: string) => {
        switch (sponsorship) {
            case 'full':
                return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'partial':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'conditional':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getPricingModelColor = (model: string) => {
        switch (model) {
            case 'free':
                return 'text-green-400';
            case 'freemium':
                return 'text-blue-400';
            case 'paid':
                return 'text-yellow-400';
            case 'credit-based':
                return 'text-purple-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Filter Controls */}
            {showSponsorshipFilter && (
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-48">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Sponsorship Type
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['all', 'full', 'partial', 'conditional'] as SponsorshipFilter[]).map((sponsorship) => (
                                    <button
                                        key={sponsorship}
                                        onClick={() => setSponsorshipFilter(sponsorship)}
                                        className={cn(
                                            'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                                            sponsorshipFilter === sponsorship
                                                ? 'bg-web3-primary text-white'
                                                : 'bg-card/50 text-muted-foreground hover:bg-web3-primary/20'
                                        )}
                                    >
                                        {sponsorship}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Paymaster List */}
            <div className="space-y-3">
                {filteredPaymasters.length === 0 ? (
                    <Card className="p-6 text-center">
                        <div className="text-muted-foreground">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            <p className="text-sm">No paymasters available for the selected filters</p>
                            <p className="text-xs mt-1">Try adjusting your sponsorship filter or selected chain</p>
                        </div>
                    </Card>
                ) : (
                    filteredPaymasters.map((paymaster) => (
                        <motion.div
                            key={paymaster.id}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                        >
                            <Card
                                className={cn(
                                    'p-4 transition-all duration-300 cursor-pointer',
                                    selectedPaymaster === paymaster.id
                                        ? 'border-web3-primary bg-web3-primary/10 shadow-neon'
                                        : 'hover:border-web3-primary/50 hover:bg-web3-primary/5'
                                )}
                            >
                                <div
                                    className="flex items-start justify-between"
                                    onClick={() => handlePaymasterSelect(paymaster.id)}
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="text-3xl">{paymaster.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-foreground">{paymaster.displayName}</h3>
                                                {paymaster.recommended && (
                                                    <span
                                                        className="text-xs bg-web3-accent/20 text-web3-accent px-2 py-0.5 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                                {paymaster.popular && (
                                                    <span
                                                        className="text-xs bg-web3-secondary/20 text-web3-secondary px-2 py-0.5 rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">{paymaster.description}</p>

                                            <div className="flex items-center gap-4 text-xs flex-wrap">
                                                <div
                                                    className={cn('px-2 py-1 rounded border', getReliabilityColor(paymaster.reliability))}>
                                                    {paymaster.reliability.charAt(0).toUpperCase() + paymaster.reliability.slice(1)} Reliability
                                                </div>
                                                <div
                                                    className={cn('px-2 py-1 rounded border', getSponsorshipColor(paymaster.gasSponsorship))}>
                                                    {paymaster.gasSponsorship} Sponsorship
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Pricing:</span>
                                                    <span className={getPricingModelColor(paymaster.pricing.model)}>
                                                        {paymaster.pricing.model}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpanded(paymaster.id);
                                            }}
                                            className="text-muted-foreground hover:text-web3-primary"
                                        >
                                            <svg
                                                className={cn(
                                                    'w-4 h-4 transition-transform',
                                                    expandedPaymaster === paymaster.id && 'rotate-180'
                                                )}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M19 9l-7 7-7-7"/>
                                            </svg>
                                        </Button>

                                        <div className={cn(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            selectedPaymaster === paymaster.id
                                                ? 'border-web3-primary bg-web3-primary'
                                                : 'border-gray-300'
                                        )}>
                                            {selectedPaymaster === paymaster.id && (
                                                <div className="w-2 h-2 bg-white rounded-full"/>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedPaymaster === paymaster.id && (
                                        <motion.div
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                            className="mt-4 pt-4 border-t border-border"
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Features */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-3">Features</h4>
                                                    <div className="space-y-2">
                                                        {paymaster.features.map((feature, index) => (
                                                            <div key={index} className="flex items-start gap-2 text-sm">
                                                                <div className={cn(
                                                                    'w-4 h-4 rounded-full flex items-center justify-center text-xs mt-0.5',
                                                                    feature.supported
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : 'bg-gray-500/20 text-gray-400'
                                                                )}>
                                                                    {feature.supported ? '✓' : '×'}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <span
                                                                        className={feature.supported ? 'text-foreground' : 'text-muted-foreground'}>
                                                                        {feature.name}
                                                                    </span>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {feature.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Sponsorship Policies */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-3">Sponsorship
                                                        Policies</h4>
                                                    <div className="space-y-3">
                                                        {paymaster.sponsorshipPolicies.map((policy, index) => (
                                                            <div key={index} className="text-sm">
                                                                <div
                                                                    className="font-medium text-foreground">{policy.name}</div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    {policy.description}
                                                                </div>
                                                                <div className="text-xs text-web3-primary mt-1">
                                                                    {policy.limits}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Pricing & Limits */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-3">Pricing &
                                                        Limits</h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Model: </span>
                                                            <span
                                                                className={cn('capitalize font-medium', getPricingModelColor(paymaster.pricing.model))}>
                                                                {paymaster.pricing.model}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Description: </span>
                                                            <span
                                                                className="text-foreground">{paymaster.pricing.description}</span>
                                                        </div>
                                                        {paymaster.pricing.costPerOperation && (
                                                            <div>
                                                                <span className="text-muted-foreground">Cost: </span>
                                                                <span
                                                                    className="text-foreground">{paymaster.pricing.costPerOperation}</span>
                                                            </div>
                                                        )}
                                                        {paymaster.limits.dailySponsorship && (
                                                            <div>
                                                                <span
                                                                    className="text-muted-foreground">Daily Limit: </span>
                                                                <span
                                                                    className="text-green-400">{paymaster.limits.dailySponsorship}</span>
                                                            </div>
                                                        )}
                                                        {paymaster.limits.perTransactionLimit && (
                                                            <div>
                                                                <span
                                                                    className="text-muted-foreground">Per Tx Limit: </span>
                                                                <span
                                                                    className="text-foreground">{paymaster.limits.perTransactionLimit}</span>
                                                            </div>
                                                        )}
                                                        {selectedChainId && paymaster.supportedChains.includes(selectedChainId) && (
                                                            <p className="text-green-400 mt-2">✓ Supports selected
                                                                network</p>
                                                        )}
                                                        <a
                                                            href={paymaster.documentation}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-web3-primary hover:underline mt-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            View Documentation
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor"
                                                                 viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                                            </svg>
                                                        </a>
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

            {filteredPaymasters.length > 0 && selectedPaymasterConfig && (
                <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        <div className="text-sm">
                            <p className="font-medium text-purple-400 mb-1">Paymaster Selection</p>
                            <p className="text-purple-300">
                                Paymasters sponsor transaction gas fees, enabling gasless transactions for users.
                                Choose based on sponsorship policies, pricing, and supported features.
                            </p>
                            <p className="text-purple-300 mt-2">
                                Selected: <strong>{selectedPaymasterConfig.displayName}</strong> - {selectedPaymasterConfig.gasSponsorship} sponsorship
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};