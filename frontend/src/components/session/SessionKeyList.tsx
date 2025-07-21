// frontend/src/components/session/SessionKeyList.tsx
import React from 'react';
import {formatEther} from 'viem';
import {useSessionKeys} from '../../hooks/useSessionKeys';
import {Button} from '../ui/Button';

export const SessionKeyList: React.FC = () => {
    const {sessionKeys, revokeSessionKey, isRevoking} = useSessionKeys();

    const formatTimeRemaining = (expiryTime: number) => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = expiryTime - now;

        if (remaining <= 0) return 'Expired';

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }

        return `${hours}h ${minutes}m`;
    };

    const isExpired = (expiryTime: number) => {
        return Math.floor(Date.now() / 1000) >= expiryTime;
    };

    if (sessionKeys.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No session keys created yet</p>
                <p className="text-sm text-slate-500">
                    Create session keys to enable temporary access for dapps
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sessionKeys.map((sessionKey, index) => (
                <div key={index} className="bg-slate-800/30 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium">Session Key</span>
                                <div className={`w-2 h-2 rounded-full ${
                                    isExpired(sessionKey.expiryTime) ? 'bg-red-400' : 'bg-green-400'
                                }`}></div>
                            </div>
                            <code className="text-sm text-slate-300 font-mono">
                                {sessionKey.key.slice(0, 10)}...{sessionKey.key.slice(-8)}
                            </code>
                        </div>

                        <Button
                            onClick={() => revokeSessionKey(sessionKey.key)}
                            loading={isRevoking}
                            variant="outline"
                            size="sm"
                        >
                            Revoke
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <span className="text-slate-400">Per Transaction</span>
                            <p className="text-white font-medium">
                                {formatEther(BigInt(sessionKey.spendingLimit))} ETH
                            </p>
                        </div>

                        <div>
                            <span className="text-slate-400">Daily Limit</span>
                            <p className="text-white font-medium">
                                {formatEther(BigInt(sessionKey.dailyLimit))} ETH
                            </p>
                        </div>

                        <div>
                            <span className="text-slate-400">Used Today</span>
                            <p className="text-white font-medium">
                                {formatEther(BigInt(sessionKey.usedToday || '0'))} ETH
                            </p>
                        </div>

                        <div>
                            <span className="text-slate-400">Time Remaining</span>
                            <p className={`font-medium ${
                                isExpired(sessionKey.expiryTime) ? 'text-red-400' : 'text-white'
                            }`}>
                                {formatTimeRemaining(sessionKey.expiryTime)}
                            </p>
                        </div>
                    </div>

                    {sessionKey.allowedTargets && sessionKey.allowedTargets.length > 0 && (
                        <div className="mt-3">
                            <span className="text-slate-400 text-sm">Allowed Targets:</span>
                            <div className="mt-1 space-y-1">
                                {sessionKey.allowedTargets.map((target, targetIndex) => (
                                    <code key={targetIndex} className="block text-xs text-slate-300 font-mono">
                                        {target}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
