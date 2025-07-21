import React, {useState, useEffect} from 'react';
import {useSmartAccount} from '../../hooks/useSmartAccount';

export const PersistentProgressCard: React.FC = () => {
    const {creationProgress, isCreatingAccount} = useSmartAccount();
    const [showCard, setShowCard] = useState(false);
    const [lastProgress, setLastProgress] = useState(0);

    // Show card when processing starts or progress changes
    useEffect(() => {
        if (creationProgress.isProcessing) {
            setShowCard(true);
            setLastProgress(creationProgress.progress);
        } else if (creationProgress.completedSteps === creationProgress.totalSteps && creationProgress.totalSteps > 0) {
            // Show success for 5 seconds
            setShowCard(true);
            const timer = setTimeout(() => {
                setShowCard(false);
                creationProgress.resetProgress();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [creationProgress.isProcessing, creationProgress.progress, creationProgress.completedSteps, creationProgress.totalSteps]);

    if (!showCard) return null;

    const isCompleted = creationProgress.completedSteps === creationProgress.totalSteps && creationProgress.totalSteps > 0;
    const isError = creationProgress.hasError;

    return (
        <div
            className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl shadow-2xl p-6 max-w-sm z-50 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    {isCompleted ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                    ) : isError ? (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </div>
                    ) : (
                        <div
                            className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <h3 className="font-semibold text-gray-900">
                        {isCompleted ? 'Smart Account Created!' :
                            isError ? 'Creation Failed' :
                                'Creating Account'}
                    </h3>
                </div>
                <button
                    onClick={() => setShowCard(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            {/* Progress content */}
            {!isCompleted && !isError && (
                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Step {creationProgress.completedSteps + 1} of {creationProgress.totalSteps}</span>
                        <span>{Math.round(creationProgress.progress)}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{width: `${creationProgress.progress}%`}}
                        />
                    </div>

                    <div className="text-sm text-gray-700 font-medium">
                        {creationProgress.currentStep?.title || 'Processing...'}
                    </div>

                    {creationProgress.currentStep?.description && (
                        <div className="text-xs text-gray-500">
                            {creationProgress.currentStep.description}
                        </div>
                    )}
                </div>
            )}

            {/* Success message */}
            {isCompleted && (
                <div className="text-center space-y-2">
                    <div className="text-green-700 font-medium">
                        Your smart account is ready for gasless transactions!
                    </div>
                    <div className="text-xs text-gray-500">
                        This notification will close automatically in 5 seconds
                    </div>
                </div>
            )}

            {/* Error message */}
            {isError && (
                <div className="space-y-2">
                    <div className="text-red-700 font-medium">
                        {creationProgress.error || 'Unknown error occurred'}
                    </div>
                    <button
                        onClick={() => {
                            creationProgress.resetProgress();
                            setShowCard(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};
