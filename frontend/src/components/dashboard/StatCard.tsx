import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Card} from '../ui/Card';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        percentage: number;
        trend: 'up' | 'down' | 'stable';
    };
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
    subtitle?: string;
    sparklineData?: number[];
    className?: string;
    animated?: boolean;
}

const colorClasses = {
    primary: {
        bg: 'from-web3-primary/10 to-web3-primary/5',
        border: 'border-web3-primary/20',
        iconBg: 'bg-web3-primary/20',
        iconText: 'text-web3-primary',
        valueText: 'text-foreground'
    },
    secondary: {
        bg: 'from-web3-secondary/10 to-web3-secondary/5',
        border: 'border-web3-secondary/20',
        iconBg: 'bg-web3-secondary/20',
        iconText: 'text-web3-secondary',
        valueText: 'text-foreground'
    },
    accent: {
        bg: 'from-web3-accent/10 to-web3-accent/5',
        border: 'border-web3-accent/20',
        iconBg: 'bg-web3-accent/20',
        iconText: 'text-web3-accent',
        valueText: 'text-foreground'
    },
    success: {
        bg: 'from-green-500/10 to-green-500/5',
        border: 'border-green-500/20',
        iconBg: 'bg-green-500/20',
        iconText: 'text-green-400',
        valueText: 'text-foreground'
    },
    warning: {
        bg: 'from-yellow-500/10 to-yellow-500/5',
        border: 'border-yellow-500/20',
        iconBg: 'bg-yellow-500/20',
        iconText: 'text-yellow-400',
        valueText: 'text-foreground'
    },
    error: {
        bg: 'from-red-500/10 to-red-500/5',
        border: 'border-red-500/20',
        iconBg: 'bg-red-500/20',
        iconText: 'text-red-400',
        valueText: 'text-foreground'
    }
};

export const StatCard: React.FC<StatCardProps> = ({
                                                      title,
                                                      value,
                                                      change,
                                                      icon,
                                                      color = 'primary',
                                                      subtitle,
                                                      sparklineData,
                                                      className,
                                                      animated = true
                                                  }) => {
    const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
    const theme = colorClasses[color];

    // Animate numeric values
    useEffect(() => {
        if (animated && typeof value === 'number') {
            const duration = 1500;
            const steps = 60;
            const stepValue = value / steps;
            const stepDuration = duration / steps;

            let currentStep = 0;
            const timer = setInterval(() => {
                currentStep++;
                if (currentStep >= steps) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(stepValue * currentStep));
                }
            }, stepDuration);

            return () => clearInterval(timer);
        } else {
            setDisplayValue(value);
        }
    }, [value, animated]);

    const getTrendIcon = () => {
        if (!change) return null;

        switch (change.trend) {
            case 'up':
                return (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7"/>
                    </svg>
                );
            case 'down':
                return (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 7l-9.2 9.2M7 7v10h10"/>
                    </svg>
                );
            case 'stable':
            default:
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4"/>
                    </svg>
                );
        }
    };

    const renderSparkline = () => {
        if (!sparklineData || sparklineData.length < 2) return null;

        const maxValue = Math.max(...sparklineData);
        const minValue = Math.min(...sparklineData);
        const range = maxValue - minValue || 1;

        const points = sparklineData.map((val, index) => {
            const x = (index / (sparklineData.length - 1)) * 60;
            const y = 20 - ((val - minValue) / range) * 20;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="mt-3">
                <svg width="60" height="20" className="opacity-60">
                    <polyline
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={theme.iconText}
                    />
                </svg>
            </div>
        );
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            whileHover={{scale: 1.02}}
            className={className}
        >
            <Card
                className={`p-6 bg-gradient-to-br ${theme.bg} ${theme.border}`}
                hover={false}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-medium">{title}</p>
                        <motion.p
                            className={`text-2xl font-bold ${theme.valueText} mt-1`}
                            key={displayValue}
                            initial={{scale: 0.8, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            transition={{duration: 0.3}}
                        >
                            {displayValue}
                        </motion.p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>

                    <div
                        className={`w-12 h-12 ${theme.iconBg} rounded-full flex items-center justify-center ${theme.iconText}`}>
                        {icon}
                    </div>
                </div>

                {/* Change indicator */}
                {change && (
                    <motion.div
                        className="flex items-center gap-2 mt-4"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.5}}
                    >
                        {getTrendIcon()}
                        <span className={`text-sm font-medium ${
                            change.trend === 'up' ? 'text-green-400' :
                                change.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                            {change.percentage > 0 && change.trend === 'up' && '+'}
                            {change.percentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                            vs last period
                        </span>
                    </motion.div>
                )}

                {/* Sparkline */}
                {renderSparkline()}

                {/* Progress indicator for loading states */}
                <motion.div
                    className={`absolute bottom-0 left-0 h-1 ${theme.iconBg} rounded-b-lg`}
                    initial={{width: "0%"}}
                    animate={{width: "100%"}}
                    transition={{duration: 2, ease: "easeInOut"}}
                />
            </Card>
        </motion.div>
    );
};