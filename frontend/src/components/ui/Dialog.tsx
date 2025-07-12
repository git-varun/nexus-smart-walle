// frontend/src/components/ui/Dialog.tsx
import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
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
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-white', className)}
    {...props}
  />
));

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
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

// frontend/src/components/ui/Toast.tsx
import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { cn } from '../../utils/cn';

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export const ToastComponent: React.FC<ToastProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-slate-800 border-slate-700',
    success: 'bg-green-800 border-green-700',
    error: 'bg-red-800 border-red-700',
    warning: 'bg-yellow-800 border-yellow-700'
  };

  return (
    <Toast.Root
      className={cn(
        'grid grid-cols-[auto_max-content] items-center gap-x-4 rounded-md border p-4 shadow-lg',
        variants[variant]
      )}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="grid gap-1">
        <Toast.Title className="text-sm font-semibold text-white">
          {title}
        </Toast.Title>
        {description && (
          <Toast.Description className="text-sm text-slate-300">
            {description}
          </Toast.Description>
        )}
      </div>
      <Toast.Action
        className="text-slate-400 hover:text-white"
        altText="Close"
      >
        ✕
      </Toast.Action>
    </Toast.Root>
  );
};

export const ToastProvider = Toast.Provider;
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof Toast.Viewport>,
  React.ComponentPropsWithoutRef<typeof Toast.Viewport>
>(({ className, ...props }, ref) => (
  <Toast.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));