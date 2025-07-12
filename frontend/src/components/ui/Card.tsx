// frontend/src/components/ui/Card.tsx
import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};