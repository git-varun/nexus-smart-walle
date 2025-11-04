import React from 'react';
import {motion} from 'framer-motion';

interface ChainData {
    chainId: number;
    name: string;
    color: string;
    percentage: number;
    transactions: number;
    volume: number;
}

interface ChainDistributionProps {
    data: ChainData[];
    className?: string;
}

export const ChainDistribution: React.FC<ChainDistributionProps> = ({data, className}) => {
    const total = data.reduce((sum, chain) => sum + chain.transactions, 0);

    // Calculate SVG circle coordinates
    const centerX = 80;
    const centerY = 80;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercentage = 0;

    const getChainIcon = (chainId: number) => {
        const icons: Record<number, string> = {
            1: "Ξ", // Ethereum
            84532: "🔵", // Base
            137: "🔮", // Polygon
            42161: "🌉", // Arbitrum
            10: "🔴", // Optimism
            8453: "🔵", // Base Mainnet
        };
        return icons[chainId] || "⚡";
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Chain Distribution</h3>
                <div className="text-sm text-muted-foreground">
                    Last 30 days
                </div>
            </div>

            <div className="flex items-center justify-center">
                {/* Donut Chart */}
                <div className="relative w-40 h-40">
                    <svg width="160" height="160" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.1)"
                            strokeWidth="8"
                        />

                        {/* Chain segments */}
                        {data.map((chain, index) => {
                            const strokeDasharray = `${(chain.percentage / 100) * circumference} ${circumference}`;
                            const strokeDashoffset = -cumulativePercentage * circumference / 100;

                            const segment = (
                                <motion.circle
                                    key={chain.chainId}
                                    cx={centerX}
                                    cy={centerY}
                                    r={radius}
                                    fill="none"
                                    stroke={chain.color}
                                    strokeWidth="8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 hover:stroke-width-10"
                                    initial={{strokeDasharray: `0 ${circumference}`}}
                                    animate={{strokeDasharray}}
                                    transition={{duration: 1, delay: index * 0.2}}
                                />
                            );

                            cumulativePercentage += chain.percentage;
                            return segment;
                        })}
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                            className="text-2xl font-bold text-foreground"
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{delay: 0.5, type: "spring"}}
                        >
                            {total}
                        </motion.div>
                        <div className="text-sm text-muted-foreground">Total Txs</div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
                {data.map((chain, index) => (
                    <motion.div
                        key={chain.chainId}
                        className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/50 hover:bg-card/50 transition-colors"
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: index * 0.1 + 0.3}}
                        whileHover={{scale: 1.02}}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                                style={{backgroundColor: chain.color}}
                            >
                                {getChainIcon(chain.chainId)}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{chain.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {chain.volume.toFixed(4)} ETH volume
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="font-semibold text-foreground">{chain.percentage.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">{chain.transactions} txs</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Summary */}
            <motion.div
                className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30"
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.8}}
            >
                <div className="text-center">
                    <p className="text-2xl font-bold text-web3-primary">
                        {data.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Chains</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-web3-secondary">
                        {data.reduce((sum, chain) => sum + chain.volume, 0).toFixed(4)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Volume (ETH)</p>
                </div>
            </motion.div>

            {/* Chain Performance Indicators */}
            <div className="grid grid-cols-1 gap-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">Performance</div>
                {data.map((chain, index) => (
                    <div key={chain.chainId} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-xs">{getChainIcon(chain.chainId)}</div>
                            <span className="text-sm text-foreground truncate">{chain.name}</span>
                        </div>
                        <div className="flex-1">
                            <div className="w-full bg-card/50 rounded-full h-2">
                                <motion.div
                                    className="h-2 rounded-full"
                                    style={{backgroundColor: chain.color}}
                                    initial={{width: 0}}
                                    animate={{width: `${chain.percentage}%`}}
                                    transition={{duration: 0.8, delay: index * 0.1 + 0.5}}
                                />
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground w-12 text-right">
                            {chain.percentage.toFixed(0)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};