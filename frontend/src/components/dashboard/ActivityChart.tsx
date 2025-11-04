import React from 'react';
import {motion} from 'framer-motion';

interface ActivityDataPoint {
    date: string;
    transactions: number;
    volume: number;
}

interface ActivityChartProps {
    data: ActivityDataPoint[];
    className?: string;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({data, className}) => {
    const maxTransactions = Math.max(...data.map(d => d.transactions));
    const maxVolume = Math.max(...data.map(d => d.volume));

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Transaction Activity</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-web3-primary rounded-full"/>
                        <span className="text-muted-foreground">Transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-web3-secondary rounded-full"/>
                        <span className="text-muted-foreground">Volume (ETH)</span>
                    </div>
                </div>
            </div>

            <div className="h-48 relative">
                <div className="absolute inset-0 flex items-end justify-between gap-1">
                    {data.map((point, index) => {
                        const transactionHeight = maxTransactions > 0 ? (point.transactions / maxTransactions) * 100 : 0;
                        const volumeHeight = maxVolume > 0 ? (point.volume / maxVolume) * 100 : 0;

                        return (
                            <motion.div
                                key={point.date}
                                className="flex-1 flex items-end gap-1"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: index * 0.1}}
                            >
                                {/* Transaction bar */}
                                <motion.div
                                    className="flex-1 bg-gradient-to-t from-web3-primary/80 to-web3-primary/40 rounded-t-sm relative group"
                                    style={{height: `${transactionHeight}%`}}
                                    whileHover={{scale: 1.05}}
                                    initial={{height: 0}}
                                    animate={{height: `${transactionHeight}%`}}
                                    transition={{duration: 0.8, delay: index * 0.1}}
                                >
                                    <div
                                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {point.transactions} txs
                                    </div>
                                </motion.div>

                                {/* Volume bar */}
                                <motion.div
                                    className="flex-1 bg-gradient-to-t from-web3-secondary/80 to-web3-secondary/40 rounded-t-sm relative group"
                                    style={{height: `${volumeHeight}%`}}
                                    whileHover={{scale: 1.05}}
                                    initial={{height: 0}}
                                    animate={{height: `${volumeHeight}%`}}
                                    transition={{duration: 0.8, delay: index * 0.1 + 0.2}}
                                >
                                    <div
                                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {point.volume.toFixed(4)} ETH
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Y-axis labels */}
                <div
                    className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-8">
                    <span>{Math.max(maxTransactions, maxVolume).toFixed(0)}</span>
                    <span>{(Math.max(maxTransactions, maxVolume) * 0.75).toFixed(0)}</span>
                    <span>{(Math.max(maxTransactions, maxVolume) * 0.5).toFixed(0)}</span>
                    <span>{(Math.max(maxTransactions, maxVolume) * 0.25).toFixed(0)}</span>
                    <span>0</span>
                </div>
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                {data.map((point, index) => (
                    <span key={index} className="text-center">
                        {new Date(point.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        })}
                    </span>
                ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div className="text-center">
                    <p className="text-2xl font-bold text-web3-primary">
                        {data.reduce((sum, point) => sum + point.transactions, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-web3-secondary">
                        {data.reduce((sum, point) => sum + point.volume, 0).toFixed(4)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Volume (ETH)</p>
                </div>
            </div>
        </div>
    );
};