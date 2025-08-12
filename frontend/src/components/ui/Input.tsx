// Web3 Modern Input Component
import React, {forwardRef, useState} from 'react';
import {motion} from 'framer-motion';
import {cn} from '@/utils/cn.ts';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    variant?: 'default' | 'cyber' | 'neon';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
                                                                   label,
                                                                   error,
                                                                   helperText,
                                                                   variant = 'default',
                                                                   leftIcon,
                                                                   rightIcon,
                                                                   className,
                                                                   ...props
                                                               }, ref) => {
    const [focused, setFocused] = useState(false);

    const baseClasses = 'web3-input font-jakarta transition-all duration-300';

    const variants = {
        default: 'bg-card/50 backdrop-blur-sm border border-border focus:border-web3-primary focus:shadow-neon',
        cyber: 'bg-gradient-to-r from-card/60 to-card/40 backdrop-blur-sm border border-web3-primary/30 focus:border-web3-primary focus:shadow-cyber',
        neon: 'bg-card/40 backdrop-blur-sm border-2 border-web3-secondary focus:border-web3-secondary focus:shadow-neon-cyan'
    };

    const errorClasses = error
        ? 'border-web3-danger focus:border-web3-danger focus:shadow-red-500/30'
        : '';

    return (
        <div className="space-y-2">
            {label && (
                <motion.label
                    initial={{opacity: 0, y: -5}}
                    animate={{opacity: 1, y: 0}}
                    className="block text-sm font-jakarta font-semibold text-foreground"
                >
                    {label}
                    {props.required && <span className="text-web3-danger ml-1">*</span>}
                </motion.label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {leftIcon}
                    </div>
                )}

                <motion.input
                    ref={ref}
                    initial={{opacity: 0, scale: 0.98}}
                    animate={{opacity: 1, scale: 1}}
                    whileFocus={{scale: 1.02}}
                    transition={{duration: 0.2}}
                    className={cn(
                        baseClasses,
                        variants[variant],
                        leftIcon && 'pl-10',
                        rightIcon && 'pr-10',
                        errorClasses,
                        className
                    )}
                    onFocus={(e) => {
                        setFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {rightIcon}
                    </div>
                )}

                {/* Focus glow effect */}
                {focused && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="absolute inset-0 -z-10 bg-web3-primary/10 blur-xl rounded-web3"
                    />
                )}
            </div>

            {error && (
                <motion.p
                    initial={{opacity: 0, x: -10}}
                    animate={{opacity: 1, x: 0}}
                    className="text-web3-danger text-sm font-jakarta flex items-center gap-1"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                </motion.p>
            )}

            {helperText && !error && (
                <motion.p
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="text-muted-foreground text-sm font-jakarta"
                >
                    {helperText}
                </motion.p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
