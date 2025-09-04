import React from 'react';
import {cn} from '@/utils/cn.ts';

export interface ProgressStep {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
}

interface ProgressProps {
    steps: ProgressStep[];
    currentStep?: string;
    className?: string;
}

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
                                                            progress,
                                                            className
                                                        }) => {
    return (
        <div className={cn(
            "w-full bg-gray-200 rounded-full h-2",
            className
        )}>
            <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{width: `${Math.max(0, Math.min(100, progress))}%`}}
            />
        </div>
    );
};

export const Progress: React.FC<ProgressProps> = ({
                                                      steps,
                                                      currentStep,
                                                      className
                                                  }) => {
    const currentIndex = currentStep ? steps.findIndex(step => step.id === currentStep) : -1;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

    const getStepIcon = (step: ProgressStep, index: number) => {
        switch (step.status) {
            case 'completed':
                return (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                );
            case 'loading':
                return (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                );
            case 'pending':
            default:
                return (
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2",
                        index === currentIndex
                            ? "border-blue-500 bg-blue-50 text-blue-500"
                            : "border-gray-300 bg-gray-50 text-gray-400"
                    )}>
                        <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                );
        }
    };

    const getStepLineColor = (step: ProgressStep, _nextStep?: ProgressStep) => {
        if (step.status === 'completed') return 'bg-green-500';
        if (step.status === 'loading') return 'bg-blue-500';
        if (step.status === 'error') return 'bg-red-500';
        return 'bg-gray-300';
    };

    return (
        <div className={cn("w-full", className)}>
            {/* Progress bar at the top */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{completedSteps} of {steps.length} completed</span>
                </div>
                <ProgressBar progress={progress}/>
            </div>

            {/* Step list */}
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                        <div className="flex items-start">
                            {/* Step icon */}
                            <div className="flex-shrink-0">
                                {getStepIcon(step, index)}
                            </div>

                            {/* Step content */}
                            <div className="ml-4 flex-1">
                                <h3 className={cn(
                                    "text-sm font-medium",
                                    step.status === 'completed' ? "text-green-700" :
                                        step.status === 'loading' ? "text-blue-700" :
                                            step.status === 'error' ? "text-red-700" :
                                                index === currentIndex ? "text-blue-600" : "text-gray-500"
                                )}>
                                    {step.title}
                                </h3>
                                {step.description && (
                                    <p className={cn(
                                        "text-sm mt-1",
                                        step.status === 'error' ? "text-red-600" : "text-gray-500"
                                    )}>
                                        {step.description}
                                    </p>
                                )}
                            </div>

                            {/* Loading indicator for current step */}
                            {step.status === 'loading' && (
                                <div className="ml-2 flex-shrink-0">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                             style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                             style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Connecting line */}
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "absolute left-4 top-8 w-0.5 h-6 -translate-x-1/2",
                                getStepLineColor(step, steps[index + 1])
                            )}/>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
