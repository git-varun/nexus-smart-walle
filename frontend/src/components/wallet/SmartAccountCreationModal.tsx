import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '../ui/Dialog';
import {Progress} from '../ui/Progress';
import {Button} from '../ui/Button';
import {useSmartAccount} from '../../hooks/useSmartAccount';

interface SmartAccountCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SmartAccountCreationModal: React.FC<SmartAccountCreationModalProps> = ({
                                                                                        isOpen,
                                                                                        onClose
                                                                                    }) => {
    const {creationProgress, isCreatingAccount, createSmartAccount, smartAccountAddress} = useSmartAccount();

    // Debug logging
    console.log('🎭 SmartAccountCreationModal render:', {
        isOpen,
        isProcessing: creationProgress.isProcessing,
        isCreatingAccount,
        steps: creationProgress.steps.length,
        currentStep: creationProgress.currentStepId,
        completedSteps: creationProgress.completedSteps,
        smartAccountAddress,
        creationProgressObject: creationProgress
    });

    const isCompleted = smartAccountAddress && creationProgress.completedSteps === creationProgress.totalSteps;

    const handleClose = () => {
        console.log('🎭 Modal handleClose called - processing:', creationProgress.isProcessing, 'error:', creationProgress.hasError, 'completed:', isCompleted);
        // Allow closing if not processing or if completed
        if (!creationProgress.isProcessing || creationProgress.hasError || isCompleted) {
            console.log('🎭 Modal closing and resetting progress...');
            creationProgress.resetProgress();
            onClose();
        } else {
            console.log('🎭 Modal close prevented - creation in progress');
        }
    };

    const handleRetry = async () => {
        creationProgress.resetProgress();
        await createSmartAccount();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        {isCompleted ? (
                            <>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <span>Account Created Successfully!</span>
                            </>
                        ) : creationProgress.hasError ? (
                            <>
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </div>
                                <span>Account Creation Failed</span>
                            </>
                        ) : creationProgress.isProcessing ? (
                            <>
                                <div
                                    className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Smart Account</span>
                            </>
                        ) : (
                            <span>Create Smart Account</span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isCompleted ? 'Your smart account is ready! You can now send gasless transactions, manage session keys, and use all smart account features.' :
                            creationProgress.hasError ? 'Something went wrong during account creation. Please try again.' :
                                creationProgress.isProcessing ? 'Please wait while we set up your smart account...' :
                                    'This will create a smart account for gasless transactions using ERC-4337 Account Abstraction.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress component */}
                {(creationProgress.isProcessing || creationProgress.hasError || creationProgress.completedSteps > 0) && (
                    <div className="mb-6">
                        <Progress
                            steps={creationProgress.steps}
                            currentStep={creationProgress.currentStepId || undefined}
                        />
                    </div>
                )}

                {/* Error message */}
                {creationProgress.hasError && creationProgress.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Creation Failed</h3>
                                <p className="text-sm text-red-700 mt-1">{creationProgress.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success features preview */}
                {isCompleted && (
                    <div className="mb-6 space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-green-800 mb-2">
                                🎉 Your Smart Account is Now Active!
                            </div>
                            <div className="text-xs text-green-700 space-y-1">
                                <div>✅ Account
                                    Address: {smartAccountAddress?.slice(0, 8)}...{smartAccountAddress?.slice(-6)}</div>
                                <div>✅ Gasless transactions enabled</div>
                                <div>✅ Session key management available</div>
                                <div>✅ Account recovery features active</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-blue-800 mb-2">
                                🚀 Next Steps Available:
                            </div>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Send your first gasless transaction</li>
                                <li>• Set up session keys for dApp access</li>
                                <li>• Configure account recovery guardians</li>
                                <li>• Explore available modules in the store</li>
                                <li>• View your transaction analytics</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end space-x-3">
                    {creationProgress.hasError && (
                        <Button
                            variant="outline"
                            onClick={handleRetry}
                            disabled={creationProgress.isProcessing}
                        >
                            Try Again
                        </Button>
                    )}

                    <Button
                        variant={isCompleted ? "primary" : "outline"}
                        onClick={handleClose}
                        disabled={creationProgress.isProcessing && !creationProgress.hasError}
                    >
                        {isCompleted ? 'Start Using Smart Account' :
                            creationProgress.hasError ? 'Close' :
                                creationProgress.isProcessing ? 'Creating...' : 'Cancel'}
                    </Button>
                </div>

                {/* Progress stats */}
                {creationProgress.isProcessing && (
                    <div className="mt-4 text-center">
                        <div className="text-sm text-gray-500">
                            Step {creationProgress.completedSteps + 1} of {creationProgress.totalSteps}
                        </div>
                        {creationProgress.currentStep && (
                            <div className="text-xs text-gray-400 mt-1">
                                {creationProgress.currentStep.title}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
