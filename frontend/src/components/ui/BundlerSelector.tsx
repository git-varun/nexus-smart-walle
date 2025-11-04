import React, {useMemo, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card} from './Card';
import {Button} from './Button';
import {cn} from '../../utils/cn';
import {BUNDLER_PROVIDERS, getBundlerById} from '../../config/bundlers';

interface BundlerSelectorProps {
    selectedBundler: string;
    onBundlerSelect: (bundlerId: string) => void;
    selectedChainId?: number;
    showReliabilityFilter?: boolean;
    className?: string;
}

type ReliabilityFilter = 'all' | 'high' | 'medium' | 'low';

export const BundlerSelector: React.FC<BundlerSelectorProps> = ({
                                                                    selectedBundler,
                                                                    onBundlerSelect,
                                                                    selectedChainId,
                                                                    showReliabilityFilter = true,
                                                                    className
                                                                }) => {
    const [reliabilityFilter, setReliabilityFilter] = useState<ReliabilityFilter>('all');
    const [expandedBundler, setExpandedBundler] = useState<string | null>(null);

    const selectedBundlerConfig = getBundlerById(selectedBundler);

    // Filter bundlers based on selected filters and chain compatibility
    const filteredBundlers = useMemo(() => {
        let bundlers = Object.values(BUNDLER_PROVIDERS);

        // Filter by chain compatibility
        if (selectedChainId) {
            bundlers = bundlers.filter(bundler => bundler.supportedChains.includes(selectedChainId));
        }

        // Filter by reliability
        if (reliabilityFilter !== 'all') {
            bundlers = bundlers.filter(bundler => bundler.reliability === reliabilityFilter);
        }

        // Sort by recommended first, then popular, then by reliability and name
        return bundlers.sort((a, b) => {
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
    }, [selectedChainId, reliabilityFilter]);

    const handleBundlerSelect = (bundlerId: string) => {
        onBundlerSelect(bundlerId);
        setExpandedBundler(null);
    };

    const toggleExpanded = (bundlerId: string) => {
        setExpandedBundler(expandedBundler === bundlerId ? null : bundlerId);
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

    const getLatencyColor = (latency: string) => {
        switch (latency) {
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

    const getGasEfficiencyColor = (efficiency: string) => {
        switch (efficiency) {
            case 'excellent':
                return 'text-green-400';
            case 'good':
                return 'text-blue-400';
            case 'average':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Filter Controls */}
            {showReliabilityFilter && (
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-48">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Reliability Filter
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['all', 'high', 'medium', 'low'] as ReliabilityFilter[]).map((reliability) => (
                                    <button
                                        key={reliability}
                                        onClick={() => setReliabilityFilter(reliability)}
                                        className={cn(
                                            'px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                                            reliabilityFilter === reliability
                                                ? 'bg-web3-primary text-white'
                                                : 'bg-card/50 text-muted-foreground hover:bg-web3-primary/20'
                                        )}
                                    >
                                        {reliability}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Bundler List */}
            <div className="space-y-3">
                {filteredBundlers.length === 0 ? (
                    <Card className="p-6 text-center">
                        <div className="text-muted-foreground">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                            </svg>
                            <p className="text-sm">No bundlers available for the selected filters</p>
                            <p className="text-xs mt-1">Try adjusting your reliability filter or selected chain</p>
                        </div>
                    </Card>
                ) : (
                    filteredBundlers.map((bundler) => (
                        <motion.div
                            key={bundler.id}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                        >
                            <Card
                                className={cn(
                                    'p-4 transition-all duration-300 cursor-pointer',
                                    selectedBundler === bundler.id
                                        ? 'border-web3-primary bg-web3-primary/10 shadow-neon'
                                        : 'hover:border-web3-primary/50 hover:bg-web3-primary/5'
                                )}
                            >
                                <div
                                    className="flex items-start justify-between"
                                    onClick={() => handleBundlerSelect(bundler.id)}
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="text-3xl">{bundler.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-foreground">{bundler.displayName}</h3>
                                                {bundler.recommended && (
                                                    <span
                                                        className="text-xs bg-web3-accent/20 text-web3-accent px-2 py-0.5 rounded-full">
                                                        Recommended
                                                    </span>
                                                )}
                                                {bundler.popular && (
                                                    <span
                                                        className="text-xs bg-web3-secondary/20 text-web3-secondary px-2 py-0.5 rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">{bundler.description}</p>

                                            <div className="flex items-center gap-4 text-xs flex-wrap">
                                                <div
                                                    className={cn('px-2 py-1 rounded border', getReliabilityColor(bundler.reliability))}>
                                                    {bundler.reliability.charAt(0).toUpperCase() + bundler.reliability.slice(1)} Reliability
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Latency:</span>
                                                    <span className={getLatencyColor(bundler.latency)}>
                                                        {bundler.latency}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Gas Efficiency:</span>
                                                    <span className={getGasEfficiencyColor(bundler.gasEfficiency)}>
                                                        {bundler.gasEfficiency}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Pricing:</span>
                                                    <span className="text-web3-primary">
                                                        {bundler.pricing.model}
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
                                                toggleExpanded(bundler.id);
                                            }}
                                            className="text-muted-foreground hover:text-web3-primary"
                                        >
                                            <svg
                                                className={cn(
                                                    'w-4 h-4 transition-transform',
                                                    expandedBundler === bundler.id && 'rotate-180'
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
                                            selectedBundler === bundler.id
                                                ? 'border-web3-primary bg-web3-primary'
                                                : 'border-gray-300'
                                        )}>
                                            {selectedBundler === bundler.id && (
                                                <div className="w-2 h-2 bg-white rounded-full"/>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedBundler === bundler.id && (
                                        <motion.div
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                            className="mt-4 pt-4 border-t border-border"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Features */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-3">Features</h4>
                                                    <div className="space-y-2">
                                                        {bundler.features.map((feature, index) => (
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

                                                {/* Pricing & Limits */}
                                                <div>
                                                    <h4 className="font-medium text-foreground mb-3">Pricing &
                                                        Limits</h4>
                                                    <div className="space-y-3 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Model: </span>
                                                            <span
                                                                className="text-foreground capitalize">{bundler.pricing.model}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Description: </span>
                                                            <span
                                                                className="text-foreground">{bundler.pricing.description}</span>
                                                        </div>
                                                        {bundler.pricing.limits && (
                                                            <div>
                                                                <span
                                                                    className="text-muted-foreground">Free Tier: </span>
                                                                <span
                                                                    className="text-green-400">{bundler.pricing.limits}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-muted-foreground">Rate Limit: </span>
                                                            <span
                                                                className="text-foreground">{bundler.limits.rateLimit}</span>
                                                        </div>
                                                        {selectedChainId && bundler.supportedChains.includes(selectedChainId) && (
                                                            <p className="text-green-400 mt-2">✓ Supports selected
                                                                network</p>
                                                        )}
                                                        <a
                                                            href={bundler.documentation}
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

            {filteredBundlers.length > 0 && selectedBundlerConfig && (
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div className="text-sm">
                            <p className="font-medium text-blue-400 mb-1">Bundler Selection</p>
                            <p className="text-blue-300">
                                Bundlers are responsible for collecting and submitting UserOperations to the blockchain.
                                Choose based on your needs for reliability, latency, and pricing.
                            </p>
                            <p className="text-blue-300 mt-2">
                                Selected: <strong>{selectedBundlerConfig.displayName}</strong> - {selectedBundlerConfig.description}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};