// Web3 Modern Card Component
import React from 'react';
import {motion} from 'framer-motion';
import {cn} from '@/utils/cn.ts';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'cyber' | 'neon' | 'elevated';
    hover?: boolean;
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
                                              variant = 'default',
                                              hover = true,
                                              className,
                                              children,
                                              ...props
                                          }) => {
    const baseClasses = 'relative overflow-hidden transition-all duration-300';

    const variants = {
        default: 'web3-card bg-card/50 backdrop-blur-sm border border-border/50 rounded-web3 shadow-cyber',
        glass: 'bg-card/20 backdrop-blur-md border border-white/10 rounded-web3 shadow-glass',
        cyber: 'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-web3-primary/30 rounded-web3 shadow-cyber',
        neon: 'bg-card/60 backdrop-blur-sm border-2 border-web3-primary rounded-web3 shadow-neon',
        elevated: 'bg-card backdrop-blur-sm border border-border rounded-web3 shadow-2xl shadow-black/20'
    };

    const hoverClasses = hover
        ? 'hover:shadow-cyber hover:border-web3-primary/40 hover:-translate-y-1 cursor-pointer'
        : '';

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            whileHover={hover ? {y: -4} : undefined}
            transition={{duration: 0.3}}
            className={cn(
                baseClasses,
                variants[variant],
                hoverClasses,
                className
            )}
            {...props}
        >
            {/* Subtle gradient overlay for depth */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"/>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

// Card subcomponents for better composition
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                               className,
                                                                               children,
                                                                               ...props
                                                                           }) => (
    <div className={cn('p-6 pb-4', className)} {...props}>
        {children}
    </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                                className,
                                                                                children,
                                                                                ...props
                                                                            }) => (
    <div className={cn('p-6 pt-0', className)} {...props}>
        {children}
    </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
                                                                               className,
                                                                               children,
                                                                               ...props
                                                                           }) => (
    <div className={cn('p-6 pt-4 border-t border-border/50', className)} {...props}>
        {children}
    </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
                                                                                  className,
                                                                                  children,
                                                                                  ...props
                                                                              }) => (
    <h3 className={cn('text-xl font-jakarta font-bold text-foreground mb-2', className)} {...props}>
        {children}
    </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
                                                                                          className,
                                                                                          children,
                                                                                          ...props
                                                                                      }) => (
    <p className={cn('text-muted-foreground font-jakarta', className)} {...props}>
        {children}
    </p>
);
