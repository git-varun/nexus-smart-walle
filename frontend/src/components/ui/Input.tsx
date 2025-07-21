// frontend/src/components/ui/Input.tsx
import React from 'react';
import {cn} from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
                                                label,
                                                error,
                                                helperText,
                                                className,
                                                ...props
                                            }) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}

            <input
                className={cn(
                    'w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            />

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            {helperText && !error && (
                <p className="text-slate-500 text-sm">{helperText}</p>
            )}
        </div>
    );
};
