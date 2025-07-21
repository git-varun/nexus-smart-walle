import {useCallback, useState} from 'react';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
}

interface ToastState extends ToastOptions {
    id: string;
    open: boolean;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const toast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 11);
        const duration = options.duration || 5000;

        const newToast: ToastState = {
            ...options,
            id,
            open: true
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return id;
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return {
        toasts,
        toast,
        dismissToast
    };
};
