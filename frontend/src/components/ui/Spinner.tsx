// Web3 Modern Spinner Component
import React from 'react';
import {motion} from 'framer-motion';
import {cn} from '@/utils/cn.ts';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'neon' | 'cyber' | 'pulse';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
                                                    size = 'md',
                                                    variant = 'default',
                                                    className
                                                }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12'
    };

    const variants = {
        default: 'border-border/30 border-t-web3-primary',
        neon: 'border-web3-primary/30 border-t-web3-primary shadow-neon',
        cyber: 'border-web3-secondary/30 border-t-web3-secondary shadow-neon-cyan',
        pulse: 'border-web3-accent/30 border-t-web3-accent animate-pulse-neon'
    };

    if (variant === 'pulse') {
        return (
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className={cn(
                    'rounded-full border-2',
                    sizes[size],
                    variants[variant],
                    className
                )}
            />
        );
    }

    return (
        <motion.div
            animate={{rotate: 360}}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
            }}
            className={cn(
                'rounded-full border-2',
                sizes[size],
                variants[variant],
                className
            )}
        />
    );
};
