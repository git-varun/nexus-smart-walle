import React from 'react';
import {useSmartAccount} from '@/hooks/useSmartAccount.ts';
import {ProgressBar} from '../ui/Progress';
import {Spinner} from '../ui/Spinner';

export const InlineProgressIndicator: React.FC = () => {
    const {creationProgress, isCreatingAccount} = useSmartAccount();

    // Only show if we're processing or have completed some steps
    if (!creationProgress.isProcessing && creationProgress.completedSteps === 0) {
        return null;
    }

    console.log('🔄 InlineProgressIndicator render:', {
        isProcessing: creationProgress.isProcessing,
        isCreatingAccount,
        currentStep: creationProgress.currentStepId,
        completedSteps: creationProgress.completedSteps,
        totalSteps: creationProgress.totalSteps
    });

    return (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
            <div className="flex items-center space-x-3">
                <Spinner size="sm"/>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                        Creating Smart Account
                    </h4>
                    <p className="text-xs text-gray-500">
                        {creationProgress.currentStep?.title || 'Processing...'}
                    </p>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                <ProgressBar progress={creationProgress.progress}/>
                <div className="flex justify-between text-xs text-gray-500">
          <span>
            Step {creationProgress.completedSteps + 1} of {creationProgress.totalSteps}
          </span>
                    <span>{Math.round(creationProgress.progress)}%</span>
                </div>
                {creationProgress.currentStep?.description && (
                    <p className="text-xs text-gray-400">
                        {creationProgress.currentStep.description}
                    </p>
                )}
            </div>

            {creationProgress.hasError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    Error: {creationProgress.error}
                </div>
            )}
        </div>
    );
};
