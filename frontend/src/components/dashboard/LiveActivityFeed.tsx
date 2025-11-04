import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card} from '../ui/Card';

interface ActivityItem {
    id: string;
    type: 'transaction' | 'account_created' | 'session_key' | 'deployment';
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: Date;
    description: string;
    details?: {
        hash?: string;
        amount?: string;
        from?: string;
        to?: string;
        chainId?: number;
        gasUsed?: string;
    };
}

interface LiveActivityFeedProps {
    activities: ActivityItem[];
    className?: string;
    maxItems?: number;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
                                                                      activities,
                                                                      className,
                                                                      maxItems = 10
                                                                  }) => {
    const [visibleActivities, setVisibleActivities] = useState<ActivityItem[]>([]);

    useEffect(() => {
        const sortedActivities = activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, maxItems);
        setVisibleActivities(sortedActivities);
    }, [activities, maxItems]);

    const getActivityIcon = (type: string, status: string) => {
        const baseClasses = "w-5 h-5";

        switch (type) {
            case 'transaction':
                return (
                    <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                );
            case 'account_created':
                return (
                    <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                );
            case 'session_key':
                return (
                    <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                );
            case 'deployment':
                return (
                    <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="5 12h14M12 5l7 7-7 7"/>
                    </svg>
                );
            default:
                return (
                    <svg className={baseClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                );
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return {
                    bg: 'bg-green-500/20',
                    text: 'text-green-400',
                    border: 'border-green-500/30'
                };
            case 'pending':
                return {
                    bg: 'bg-yellow-500/20',
                    text: 'text-yellow-400',
                    border: 'border-yellow-500/30'
                };
            case 'failed':
                return {
                    bg: 'bg-red-500/20',
                    text: 'text-red-400',
                    border: 'border-red-500/30'
                };
            default:
                return {
                    bg: 'bg-gray-500/20',
                    text: 'text-gray-400',
                    border: 'border-gray-500/30'
                };
        }
    };

    const getChainName = (chainId?: number) => {
        const chains: Record<number, string> = {
            1: 'Ethereum',
            84532: 'Base Sepolia',
            137: 'Polygon',
            42161: 'Arbitrum',
            10: 'Optimism',
            8453: 'Base'
        };
        return chainId ? chains[chainId] || `Chain ${chainId}` : '';
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return timestamp.toLocaleDateString();
    };

    return (
        <div className={className}>
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="w-2 h-2 bg-green-400 rounded-full"
                            animate={{opacity: [1, 0.5, 1]}}
                            transition={{duration: 2, repeat: Infinity}}
                        />
                        <span className="text-sm text-muted-foreground">Live</span>
                    </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                    <AnimatePresence>
                        {visibleActivities.length === 0 ? (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                className="text-center py-8 text-muted-foreground"
                            >
                                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <p>No recent activity</p>
                                <p className="text-sm mt-1">Your transactions will appear here</p>
                            </motion.div>
                        ) : (
                            visibleActivities.map((activity, index) => {
                                const statusColor = getStatusColor(activity.status);

                                return (
                                    <motion.div
                                        key={activity.id}
                                        initial={{opacity: 0, x: -20}}
                                        animate={{opacity: 1, x: 0}}
                                        exit={{opacity: 0, x: 20}}
                                        transition={{delay: index * 0.1}}
                                        className={`flex items-start gap-4 p-4 rounded-lg border ${statusColor.border} ${statusColor.bg} hover:bg-card/50 transition-colors`}
                                    >
                                        <div
                                            className={`p-2 rounded-full ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                                            {getActivityIcon(activity.type, activity.status)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {activity.description}
                                                    </p>
                                                    {activity.details && (
                                                        <div className="mt-1 space-y-1">
                                                            {activity.details.hash && (
                                                                <p className="text-xs text-muted-foreground font-mono">
                                                                    {activity.details.hash.slice(0, 10)}...{activity.details.hash.slice(-8)}
                                                                </p>
                                                            )}
                                                            {activity.details.amount && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Amount: {activity.details.amount} ETH
                                                                </p>
                                                            )}
                                                            {activity.details.chainId && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Network: {getChainName(activity.details.chainId)}
                                                                </p>
                                                            )}
                                                            {activity.details.gasUsed && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Gas: {activity.details.gasUsed}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                                                        {activity.status === 'pending' && (
                                                            <motion.div
                                                                className="w-2 h-2 bg-current rounded-full"
                                                                animate={{scale: [1, 1.2, 1]}}
                                                                transition={{duration: 1.5, repeat: Infinity}}
                                                            />
                                                        )}
                                                        {activity.status}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatTimestamp(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* View More Button */}
                {activities.length > maxItems && (
                    <motion.div
                        className="mt-4 text-center"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.5}}
                    >
                        <button className="text-sm text-web3-primary hover:text-web3-primary/80 font-medium">
                            View All Activity ({activities.length - maxItems} more)
                        </button>
                    </motion.div>
                )}
            </Card>
        </div>
    );
};