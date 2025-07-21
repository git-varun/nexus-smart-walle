// frontend/src/components/ui/Dialog.tsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {cn} from '../../utils/cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({className, children, ...props}, ref) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"/>
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-slate-900 border border-slate-700 p-6 shadow-lg duration-200 rounded-xl',
                className
            )}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));

const DialogHeader = ({
                          className,
                          ...props
                      }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
        {...props}
    />
);

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({className, ...props}, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold text-white', className)}
        {...props}
    />
));

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({className, ...props}, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-slate-400', className)}
        {...props}
    />
));

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
};
