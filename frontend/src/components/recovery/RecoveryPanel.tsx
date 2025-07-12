// frontend/src/components/recovery/RecoveryPanel.tsx
import React, { useState } from 'react';
import { useRecovery } from '../../hooks/useRecovery';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GuardianSetup } from './GuardianSetup';
import { RecoveryProcess } from './RecoveryProcess';

export const RecoveryPanel: React.FC = () => {
  const {
    recoveryConfig,
    pendingRecovery,
    isLoading,
    setupRecovery,
    initiateRecovery,
    approveRecovery,
    executeRecovery,
    cancelRecovery
  } = useRecovery();

  const [activeTab, setActiveTab] = useState<'setup' | 'process' | 'status'>('setup');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Account Recovery</h2>
        <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
          {[
            { id: 'setup', label: 'Setup' },
            { id: 'process', label: 'Recovery' },
            { id: 'status', label: 'Status' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'setup' && (
        <GuardianSetup
          config={recoveryConfig}
          onSetup={setupRecovery}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'process' && (
        <RecoveryProcess
          config={recoveryConfig}
          pendingRecovery={pendingRecovery}
          onInitiate={initiateRecovery}
          onApprove={approveRecovery}
          onExecute={executeRecovery}
          onCancel={cancelRecovery}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'status' && (
        <div className="space-y-4">
          {recoveryConfig ? (
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Recovery Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Guardians:</span>
                  <span className="text-white ml-2">{recoveryConfig.guardians.length}</span>
                </div>
                <div>
                  <span className="text-slate-400">Threshold:</span>
                  <span className="text-white ml-2">{recoveryConfig.threshold}</span>
                </div>
                <div>
                  <span className="text-slate-400">Delay:</span>
                  <span className="text-white ml-2">{recoveryConfig.delay / 3600} hours</span>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-slate-400">Guardian Addresses:</span>
                <div className="mt-2 space-y-1">
                  {recoveryConfig.guardians.map((guardian, index) => (
                    <div key={index} className="text-sm font-mono text-slate-300">
                      {guardian}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No recovery configuration set up</p>
              <p className="text-sm text-slate-500 mt-2">
                Set up guardians to enable account recovery
              </p>
            </div>
          )}

          {pendingRecovery && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-400 mb-3">⚠️ Pending Recovery</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">New Owner:</span>
                  <span className="text-white ml-2 font-mono">{pendingRecovery.newOwner}</span>
                </div>
                <div>
                  <span className="text-slate-400">Execute After:</span>
                  <span className="text-white ml-2">
                    {new Date(pendingRecovery.executeAfter * 1000).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Approvals:</span>
                  <span className="text-white ml-2">
                    {pendingRecovery.approvedBy.length} / {recoveryConfig?.threshold}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};