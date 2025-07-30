// UserOperationStatus.tsx - Component to show detailed UserOperation lifecycle
import React from 'react';
import {Card} from '../ui/Card';
import {UserOperationLifecycle, UserOperationStage} from '../../types/userOperation';

interface UserOperationStatusProps {
    lifecycle: UserOperationLifecycle;
    onClose?: () => void;
}

export const UserOperationStatus: React.FC<UserOperationStatusProps> = ({lifecycle, onClose}) => {
    const getStageIcon = (stage: UserOperationStage) => {
        switch (stage.status) {
            case 'completed':
                return '✅';
            case 'in_progress':
                return '🔄';
            case 'failed':
                return '❌';
            default:
                return '⏳';
        }
    };

    const getStageColor = (stage: UserOperationStage) => {
        switch (stage.status) {
            case 'completed':
                return 'text-green-400';
            case 'in_progress':
                return 'text-blue-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-slate-400';
        }
    };

    const getOverallStatusColor = () => {
        switch (lifecycle.overallStatus) {
            case 'success':
                return 'text-green-400';
            case 'failed':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return 'Pending';
        return new Date(timestamp).toLocaleTimeString();
    };

    const getElapsedTime = () => {
        const elapsed = Date.now() - lifecycle.createdAt;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);

        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">UserOperation Status</h3>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-sm font-medium ${getOverallStatusColor()}`}>
                            {lifecycle.overallStatus.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                            • {getElapsedTime()} elapsed
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* UserOp Hash */}
            <div className="mb-6 p-3 bg-slate-800/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">UserOperation Hash</div>
                <div className="text-sm font-mono text-slate-300 break-all">
                    {lifecycle.userOpHash}
                </div>
            </div>

            {/* Final Transaction Hash (if available) */}
            {lifecycle.finalTxHash && (
                <div className="mb-6 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <div className="text-xs text-green-400 mb-1">Final Transaction Hash</div>
                    <div className="text-sm font-mono text-green-300 break-all">
                        {lifecycle.finalTxHash}
                    </div>
                    {lifecycle.finalBlockNumber && (
                        <div className="text-xs text-green-400 mt-1">
                            Block: {lifecycle.finalBlockNumber}
                        </div>
                    )}
                </div>
            )}

            {/* Error Message (if failed) */}
            {lifecycle.error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                    <div className="text-xs text-red-400 mb-1">Error</div>
                    <div className="text-sm text-red-300">{lifecycle.error}</div>
                </div>
            )}

            {/* Stage Progress */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">ERC-4337 Flow Progress</h4>

                {lifecycle.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start space-x-3">
                        {/* Stage Icon */}
                        <div className="flex-shrink-0 mt-1">
                            <span className="text-lg">{getStageIcon(stage)}</span>
                        </div>

                        {/* Stage Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h5 className={`text-sm font-medium ${getStageColor(stage)}`}>
                                    {stage.title}
                                </h5>
                                <span className="text-xs text-slate-400">
                                    {formatTimestamp(stage.timestamp)}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mb-2">
                                {stage.description}
                            </p>

                            {stage.details && (
                                <div className="text-xs text-slate-500 bg-slate-800/50 rounded px-2 py-1">
                                    {stage.details}
                                </div>
                            )}

                            {/* Additional stage-specific info */}
                            {stage.txHash && (
                                <div className="mt-2 text-xs">
                                    <span className="text-slate-400">Tx Hash: </span>
                                    <span className="font-mono text-slate-300">
                                        {stage.txHash.slice(0, 10)}...{stage.txHash.slice(-8)}
                                    </span>
                                </div>
                            )}

                            {stage.gasUsed && (
                                <div className="mt-1 text-xs">
                                    <span className="text-slate-400">Gas Used: </span>
                                    <span className="text-slate-300">{stage.gasUsed}</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Line */}
                        {index < lifecycle.stages.length - 1 && (
                            <div className="absolute left-[22px] mt-8 h-8 w-0.5 bg-slate-600"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Gas Information */}
            {(lifecycle.estimatedGas || lifecycle.actualGasUsed) && (
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Gas Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        {lifecycle.estimatedGas && (
                            <div>
                                <span className="text-slate-400">Estimated: </span>
                                <span className="text-slate-300">{lifecycle.estimatedGas}</span>
                            </div>
                        )}
                        {lifecycle.actualGasUsed && (
                            <div>
                                <span className="text-slate-400">Actual: </span>
                                <span className="text-slate-300">{lifecycle.actualGasUsed}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Auto-refresh indicator for pending operations */}
            {lifecycle.overallStatus === 'pending' && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <div
                            className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Auto-updating every 5 seconds...</span>
                    </div>
                </div>
            )}
        </Card>
    );
};
