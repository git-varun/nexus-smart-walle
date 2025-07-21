import React from 'react';
import {useSmartAccount} from '../../hooks/useSmartAccount';
import {ProgressBar} from '../ui/Progress';
import {Spinner} from '../ui/Spinner';
import {cn} from '../../utils/cn';

interface SmartAccountStatusProps {
    className?: string;
    showProgress?: boolean;
    compact?: boolean;
}

export const SmartAccountStatus: React.FC<SmartAccountStatusProps> = ({
                                                                          className,
                                                                          showProgress = false,
                                                                          compact = false
                                                                      }) => {
    const {
        smartAccountAddress,
        isCreatingAccount,
        creationProgress
    } = useSmartAccount();

    // If account exists and is ready
    if (smartAccountAddress && !isCreatingAccount) {
        return (
            <div className={cn(
                "flex items-center space-x-2 text-green-600",
                className
            )}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={cn(
                    "font-medium",
                    compact ? "text-xs" : "text-sm"
                )}>
          Smart Account Active
        </span>
                {!compact && (
                    <span className="text-xs text-gray-500 font-mono">
            {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
          </span>
                )}
            </div>
        );
    }

    // If currently creating account
    if (isCreatingAccount || creationProgress.isProcessing) {
        return (
            <div className={cn("space-y-2", className)}>
                <div className="flex items-center space-x-2">
                    <Spinner size="sm"/>
                    <span className={cn(
                        "text-blue-600 font-medium",
                        compact ? "text-xs" : "text-sm"
                    )}>
            {creationProgress.currentStep?.title || 'Creating Smart Account...'}
          </span>
                </div>

                {showProgress && !compact && (
                    <div className="space-y-1">
                        <ProgressBar progress={creationProgress.progress}/>
                        <div className="flex justify-between text-xs text-gray-500">
              <span>
                Step {creationProgress.completedSteps + 1} of {creationProgress.totalSteps}
              </span>
                            <span>{Math.round(creationProgress.progress)}%</span>
                        </div>
                    </div>
                )}

                {creationProgress.currentStep?.description && !compact && (
                    <p className="text-xs text-gray-400">
                        {creationProgress.currentStep.description}
                    </p>
                )}
            </div>
        );
    }

    // If there's an error
    if (creationProgress.hasError) {
        return (
            <div className={cn(
                "flex items-center space-x-2 text-red-600",
                className
            )}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className={cn(
                    "font-medium",
                    compact ? "text-xs" : "text-sm"
                )}>
          Creation Failed
        </span>
                {!compact && creationProgress.error && (
                    <span className="text-xs text-gray-500">
            {creationProgress.error}
          </span>
                )}
            </div>
        );
    }

    // Default state - no account
    return (
        <div className={cn(
            "flex items-center space-x-2 text-gray-400",
            className
        )}>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className={cn(
                compact ? "text-xs" : "text-sm"
            )}>
        No Smart Account
      </span>
        </div>
    );
};
