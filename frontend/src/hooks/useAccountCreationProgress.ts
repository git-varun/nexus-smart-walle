import {useState, useCallback} from 'react';
import {ProgressStep} from '../components/ui/Progress';

export interface AccountCreationStep {
    id: string;
    title: string;
    description: string;
    action?: () => Promise<void>;
}

const ACCOUNT_CREATION_STEPS: AccountCreationStep[] = [
    {
        id: 'validate-wallet',
        title: 'Validating Wallet Connection',
        description: 'Checking wallet connection and prerequisites'
    },
    {
        id: 'create-transport',
        title: 'Setting up Transport',
        description: 'Initializing Alchemy transport layer'
    },
    {
        id: 'create-signer',
        title: 'Creating Signer',
        description: 'Setting up wallet client signer adapter'
    },
    {
        id: 'create-account',
        title: 'Creating Smart Account',
        description: 'Deploying your smart account with Account Kit'
    },
    {
        id: 'create-client',
        title: 'Setting up Client',
        description: 'Initializing smart account client for transactions'
    },
    {
        id: 'finalize',
        title: 'Finalizing Setup',
        description: 'Completing smart account initialization'
    }
];

export const useAccountCreationProgress = () => {
    const [steps, setSteps] = useState<ProgressStep[]>(
        ACCOUNT_CREATION_STEPS.map(step => ({
            ...step,
            status: 'pending' as const
        }))
    );
    const [currentStepId, setCurrentStepId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStepStatus = useCallback((stepId: string, status: ProgressStep['status'], description?: string) => {
        setSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === stepId
                    ? {
                        ...step,
                        status,
                        description: description || step.description
                    }
                    : step
            )
        );
    }, []);

    const startStep = useCallback((stepId: string, description?: string) => {
        console.log('🔄 AccountCreationProgress: Starting step:', stepId);
        setCurrentStepId(stepId);
        updateStepStatus(stepId, 'loading', description);
    }, [updateStepStatus]);

    const completeStep = useCallback((stepId: string, description?: string) => {
        updateStepStatus(stepId, 'completed', description);
    }, [updateStepStatus]);

    const failStep = useCallback((stepId: string, error: string) => {
        updateStepStatus(stepId, 'error', error);
        setError(error);
    }, [updateStepStatus]);

    const resetProgress = useCallback(() => {
        setSteps(ACCOUNT_CREATION_STEPS.map(step => ({
            ...step,
            status: 'pending' as const
        })));
        setCurrentStepId(null);
        setIsProcessing(false);
        setError(null);
    }, []);

    const startProcess = useCallback(() => {
        console.log('🚀 AccountCreationProgress: Starting process...');
        setIsProcessing(true);
        setError(null);
        resetProgress();
    }, [resetProgress]);

    const finishProcess = useCallback(() => {
        setIsProcessing(false);
        setCurrentStepId(null);
    }, []);

    // Helper function to run a step with error handling
    const runStep = useCallback(async (
        stepId: string,
        action: () => Promise<void>,
        loadingDescription?: string,
        successDescription?: string
    ) => {
        try {
            startStep(stepId, loadingDescription);

            // Add a small delay to make progress visible
            await new Promise(resolve => setTimeout(resolve, 1000));

            await action();

            // Another small delay to show completion
            await new Promise(resolve => setTimeout(resolve, 800));

            completeStep(stepId, successDescription);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            failStep(stepId, errorMessage);
            throw error;
        }
    }, [startStep, completeStep, failStep]);

    // Get current step details
    const currentStep = currentStepId ? steps.find(step => step.id === currentStepId) : null;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = (completedSteps / steps.length) * 100;
    const hasError = steps.some(step => step.status === 'error');

    return {
        steps,
        currentStepId,
        currentStep,
        isProcessing,
        progress,
        completedSteps,
        totalSteps: steps.length,
        error,
        hasError,

        // Actions
        startProcess,
        finishProcess,
        resetProgress,
        startStep,
        completeStep,
        failStep,
        runStep,
        updateStepStatus
    };
};

// Type exports for use in other components
export type {ProgressStep};
