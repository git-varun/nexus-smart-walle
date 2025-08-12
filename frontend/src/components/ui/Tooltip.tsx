import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

interface TooltipProps {
    content: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left';
    delay?: number;
    className?: string;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
                                                    content,
                                                    position = 'top',
                                                    delay = 200,
                                                    className = '',
                                                    children
                                                }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    const getPositionClasses = () => {
        const baseClasses = 'absolute z-50';
        switch (position) {
            case 'top':
                return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
            case 'bottom':
                return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
            case 'left':
                return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
            case 'right':
                return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
            case 'top-right':
                return `${baseClasses} bottom-full right-0 mb-2`;
            case 'top-left':
                return `${baseClasses} bottom-full left-0 mb-2`;
            default:
                return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
        }
    };

    const getArrowClasses = () => {
        const baseArrowClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
        switch (position) {
            case 'top':
                return `${baseArrowClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
            case 'bottom':
                return `${baseArrowClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
            case 'left':
                return `${baseArrowClasses} left-full top-1/2 -translate-y-1/2 -ml-1`;
            case 'right':
                return `${baseArrowClasses} right-full top-1/2 -translate-y-1/2 -mr-1`;
            case 'top-right':
                return `${baseArrowClasses} top-full right-3 -mt-1`;
            case 'top-left':
                return `${baseArrowClasses} top-full left-3 -mt-1`;
            default:
                return `${baseArrowClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
        }
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        transition={{duration: 0.15}}
                        className={getPositionClasses()}
                    >
                        <div className={`
                            bg-gray-900 text-white text-sm rounded-lg px-3 py-2 
                            shadow-lg border border-gray-700 max-w-xs
                            ${className}
                        `}>
                            {content}
                            <div className={getArrowClasses()}></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
