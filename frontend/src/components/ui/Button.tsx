// Web3 Modern Button Component
import React from 'react';
import {motion} from 'framer-motion';
import {cn} from '@/utils/cn.ts';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    glow?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
                                                  variant = 'primary',
                                                  size = 'md',
                                                  loading = false,
                                                  glow = false,
                                                  className,
                                                  children,
                                                  disabled,
                                                  ...props
                                              }) => {
    const baseClasses = 'web3-button relative overflow-hidden font-jakarta font-semibold transition-all duration-300 active:scale-95';

    const variants = {
        primary: 'bg-web3-primary hover:bg-web3-primary/90 text-white shadow-neon hover:shadow-neon',
        secondary: 'bg-web3-secondary hover:bg-web3-secondary/90 text-white shadow-neon-cyan hover:shadow-neon-cyan',
        accent: 'bg-web3-accent hover:bg-web3-accent/90 text-white shadow-neon-green hover:shadow-neon-green',
        outline: 'border-2 border-web3-primary text-web3-primary hover:bg-web3-primary hover:text-white bg-transparent backdrop-blur-sm',
        ghost: 'text-foreground hover:bg-web3-primary/10 hover:text-web3-primary bg-transparent',
        danger: 'bg-web3-danger hover:bg-web3-danger/90 text-white shadow-red-500/30 hover:shadow-red-500/50'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm h-9',
        md: 'px-6 py-3 text-sm h-11',
        lg: 'px-8 py-4 text-base h-13',
        xl: 'px-10 py-5 text-lg h-16'
    };

    const glowClass = glow ? 'animate-pulse-neon' : '';

    return (
        <button
            className={cn(
                baseClasses,
                variants[variant],
                sizes[size],
                glowClass,
                disabled && 'opacity-50 cursor-not-allowed',
                'hover:scale-105 active:scale-95 transition-transform duration-150',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {/* Shimmer Effect */}
            <div
                className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full hover:translate-x-full"></div>

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                {loading && (
                    <motion.div
                        animate={{rotate: 360}}
                        transition={{duration: 1, repeat: Infinity, ease: "linear"}}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                )}
                {children}
            </div>
        </button>
    );
};
