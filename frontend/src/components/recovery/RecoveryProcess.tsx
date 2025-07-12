// frontend/src/components/recovery/RecoveryProcess.tsx
import React, { useState } from 'react';
import { isAddress } from 'viem';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RecoveryProcessProps {
  config: any;
  pendingRecovery: any;
  onInitiate: (newOwner: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onExecute: () => Promise<void>;
  onCancel: () => Promise<void>;
  isLoading: boolean;
}

export const RecoveryProcess: React.FC<RecoveryProcessProps> = ({
  config,
  pendingRecovery,
  onInitiate,
  onApprove,
  onExecute,
  onCancel,
  isLoading
}) => {
  const [newOwner, setNewOwner] = useState('');
  const [error, setError] = useState('');

  const handleInitiate = async () => {
    if (!isAddress(newOwner)) {
      setError('Please enter a valid address');
      return;
    }

    try {
      await onInitiate(newOwner);
      setNewOwner('');
      setError('');
    } catch (error) {
      console.error('Failed to initiate recovery:', error);
      setError('Failed to initiate recovery');
    }
  };

  const canExecuteRecovery = () => {
    if (!pendingRecovery) return false;

    const now = Math.floor(Date.now() / 1000);
    const hasEnoughApprovals = pendingRecovery.approvedBy.length >= config?.threshold;
    const delayMet = now >= pendingRecovery.executeAfter;

    return hasEnoughApprovals && delayMet && !pendingRecovery.isExecuted && !pendingRecovery.isCancelled;
  };

  const getTimeRemaining = () => {
    if (!pendingRecovery) return '';

    const now = Math.floor(Date.now() / 1000);
    const remaining = pendingRecovery.executeAfter - now;

    if (remaining <= 0) return 'Ready to execute';

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return `${hours}h ${minutes}m remaining`;
  };

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 mb-4">Recovery not configured</p>
        <p className="text-sm text-slate-500">
          Please set up guardians first to enable recovery
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!pendingRecovery ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Initiate Recovery</h3>
          <p className="text-sm text-slate-400">
            Start the recovery process by specifying a new owner address.
            {config.threshold} out of {config.guardians.length} guardians must approve.
          </p>

          <Input
            label="New Owner Address"
            placeholder="0x..."
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            error={error}
            helperText="Address that will become the new account owner"
          />

          <Button
            onClick={handleInitiate}
            loading={isLoading}
            variant="primary"
            className="w-full"
          >
            Initiate Recovery
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="text-yellow-400 font-medium mb-2">🔄 Recovery in Progress</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">New Owner:</span>
                <span className="text-white ml-2 font-mono">{pendingRecovery.newOwner}</span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <span className="text-white ml-2">{getTimeRemaining()}</span>
              </div>
              <div>
                <span className="text-slate-400">Approvals:</span>
                <span className="text-white ml-2">
                  {pendingRecovery.approvedBy.length} / {config.threshold}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={onApprove}
              loading={isLoading}
              variant="primary"
              disabled={pendingRecovery.isExecuted || pendingRecovery.isCancelled}
            >
              Approve Recovery
            </Button>

            <Button
              onClick={onExecute}
              loading={isLoading}
              variant="primary"
              disabled={!canExecuteRecovery()}
            >
              Execute Recovery
            </Button>

            <Button
              onClick={onCancel}
              loading={isLoading}
              variant="outline"
              disabled={pendingRecovery.isExecuted || pendingRecovery.isCancelled}
            >
              Cancel Recovery
            </Button>
          </div>

          {pendingRecovery.approvedBy.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Approved by:</h4>
              <div className="space-y-1">
                {pendingRecovery.approvedBy.map((guardian: string, index: number) => (
                  <div key={index} className="text-sm font-mono text-slate-400">
                    {guardian}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};