import React, {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '../ui/Dialog';
import {Button} from '../ui/Button';
import {useSmartAccount} from '../../hooks/useSmartAccount';

interface SimpleProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    smartAccountAddress?: string;
}

export const SimpleProgressModal: React.FC<SimpleProgressModalProps> = ({
                                                                            isOpen,
                                                                            onClose,
                                                                            smartAccountAddress: propSmartAccountAddress
                                                                        }) => {
    const smartAccountHook = useSmartAccount();
    const {isCreatingAccount, smartAccountAddress: hookSmartAccountAddress} = smartAccountHook;

    // Use prop if provided, otherwise use hook value
    const smartAccountAddress = propSmartAccountAddress || hookSmartAccountAddress;

    // Debug the entire hook return
    console.log('🔧 Full useSmartAccount hook return:', {
        isCreatingAccount: smartAccountHook.isCreatingAccount,
        hookSmartAccountAddress: smartAccountHook.smartAccountAddress,
        propSmartAccountAddress: propSmartAccountAddress,
        finalSmartAccountAddress: smartAccountAddress,
        smartAccount: !!smartAccountHook.smartAccount,
        isConnected: smartAccountHook.isConnected,
        address: smartAccountHook.address
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const steps = [
        'Validating wallet connection...',
        'Setting up transport layer...',
        'Creating wallet signer...',
        'Deploying smart account...',
        'Initializing client...',
        'Finalizing setup...'
    ];

    console.log('🎭 SimpleProgressModal render:', {
        isOpen,
        isCreatingAccount,
        smartAccountAddress: smartAccountAddress || 'null',
        currentStep,
        isCompleted,
        progress: Math.min((currentStep / steps.length) * 100, 100)
    });

    // Simulate progress when creation is active
    useEffect(() => {
        if (isCreatingAccount && isOpen) {
            console.log('🎬 SimpleProgressModal: Starting progress simulation');
            setCurrentStep(0);
            setIsCompleted(false);

            const interval = setInterval(() => {
                setCurrentStep(prev => {
                    const next = prev + 1;
                    if (next >= steps.length) {
                        clearInterval(interval);
                        return prev;
                    }
                    return next;
                });
            }, 1500); // Change step every 1.5 seconds

            return () => clearInterval(interval);
        }
    }, [isCreatingAccount, isOpen]);

    // Check for completion - multiple ways to detect it
    useEffect(() => {
        console.log('🔍 SimpleProgressModal: Checking completion state:', {
            smartAccountAddress: !!smartAccountAddress,
            addressValue: smartAccountAddress,
            isCreatingAccount,
            currentStep,
            stepsLength: steps.length,
            currentIsCompleted: isCompleted
        });

        // If we have a smart account address, mark as completed regardless of other states
        if (smartAccountAddress && smartAccountAddress.length > 0 && !isCompleted) {
            console.log('🎉 SimpleProgressModal: Account creation completed! Address:', smartAccountAddress);
            setIsCompleted(true);
            setCurrentStep(steps.length);
        }
    }, [smartAccountAddress, isCreatingAccount, currentStep, isCompleted]);

    const handleClose = () => {
        console.log('🚪 SimpleProgressModal handleClose - canClose:', !isCreatingAccount || isCompleted);
        console.log('🚪 Closing modal - final smartAccountAddress:', smartAccountAddress);
        if (!isCreatingAccount || isCompleted) {
            setCurrentStep(0);
            setIsCompleted(false);
            onClose();
        }
    };

    const progress = isCompleted ? 100 : Math.min((currentStep / steps.length) * 100, 100);

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
                        ) : isCreatingAccount ? (
                            <>
                                <div
                                    className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Smart Account</span>
                            </>
                        ) : (
                            <span>Smart Account Creation</span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isCompleted ? 'Your smart account is ready! You can now use all smart account features.' :
                            isCreatingAccount ? 'Please wait while we set up your smart account...' :
                                'Smart account creation process'}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress display */}
                <div className="space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{width: `${progress}%`}}
                            />
                        </div>
                    </div>

                    {/* Current step */}
                    {isCreatingAccount && currentStep < steps.length && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-blue-900 mb-1">
                                Step {currentStep + 1} of {steps.length}
                            </div>
                            <div className="text-sm text-blue-700">
                                {steps[currentStep]}
                            </div>
                        </div>
                    )}

                    {/* Success message */}
                    {isCompleted && smartAccountAddress && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-green-800 mb-3">
                                    🎉 Smart Account Created Successfully!
                                </div>

                                {/* Smart Account Address Display */}
                                <div className="bg-white border border-green-300 rounded-lg p-3 mb-3">
                                    <div className="text-xs font-medium text-gray-600 mb-1">Your Smart Account
                                        Address:
                                    </div>
                                    <div
                                        className="font-mono text-sm text-gray-800 break-all bg-gray-50 p-2 rounded border">
                                        {smartAccountAddress}
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(smartAccountAddress)}
                                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        📋 Copy Address
                                    </button>
                                </div>

                                <div className="text-xs text-green-700 space-y-1">
                                    <div>✅ Gasless transactions enabled</div>
                                    <div>✅ Session key management available</div>
                                    <div>✅ Account recovery features active</div>
                                    <div>✅ All smart account features unlocked</div>
                                </div>
                            </div>

                            {/* Next Steps */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-blue-800 mb-2">
                                    🚀 What's Next:
                                </div>
                                <ul className="text-xs text-blue-700 space-y-1 ml-2">
                                    <li>• Send your first gasless transaction</li>
                                    <li>• Set up session keys for dApp access</li>
                                    <li>• Configure account recovery guardians</li>
                                    <li>• Explore available modules</li>
                                    <li>• View your transaction analytics</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                    <Button
                        variant={isCompleted ? "primary" : "outline"}
                        onClick={handleClose}
                        disabled={isCreatingAccount && !isCompleted}
                    >
                        {isCompleted ? 'Start Using Account' :
                            isCreatingAccount ? 'Creating...' : 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
