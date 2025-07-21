// frontend/src/components/wallet/WalletInfo.tsx
import React from 'react';
import {formatEther} from 'viem';
import {useSmartAccount} from '@/hooks/useSmartAccount.ts';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';

export const WalletInfo: React.FC = () => {
    const {
        smartAccountAddress,
        balance,
        tokenBalances,
        nonce,
        isDeployed,
        paymasterDeposit,
        isLoading,
        refreshData
    } = useSmartAccount();

    console.log('🏦 WalletInfo render:', {
        smartAccountAddress,
        balance,
        nonce,
        isDeployed,
        isLoading
    });

    if (!smartAccountAddress) {
        console.log('❌ WalletInfo: No smart account address, not rendering');
        return null;
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Smart Account</h2>
                <Button onClick={refreshData} variant="outline" size="sm" loading={isLoading}>
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Account Status */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Status</span>
                        <div className={`w-2 h-2 rounded-full ${isDeployed ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    </div>
                    <p className="text-white font-medium">
                        {isDeployed ? 'Deployed' : 'Counterfactual'}
                    </p>
                </div>

                {/* ETH Balance */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">ETH Balance</div>
                    <p className="text-white font-medium">
                        {balance ? formatEther(BigInt(balance)) : '0.00'} ETH
                    </p>
                </div>

                {/* Nonce */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Nonce</div>
                    <p className="text-white font-medium">{nonce?.toString() || '0'}</p>
                </div>

                {/* Paymaster Deposit */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Paymaster Deposit</div>
                    <p className="text-white font-medium">
                        {paymasterDeposit ? paymasterDeposit : '0.00'} ETH
                    </p>
                </div>
            </div>

            {/* Account Address */}
            <div className="mt-6">
                <div className="text-sm text-slate-400 mb-2">Account Address</div>
                <div className="flex items-center space-x-2">
                    <code className="bg-slate-800/50 px-3 py-2 rounded text-sm text-slate-300 flex-1">
                        {smartAccountAddress}
                    </code>
                    <Button
                        onClick={() => navigator.clipboard.writeText(smartAccountAddress)}
                        variant="outline"
                        size="sm"
                    >
                        Copy
                    </Button>
                </div>
            </div>

            {/* Token Balances */}
            {tokenBalances && tokenBalances.length > 0 && (
                <div className="mt-6">
                    <div className="text-sm text-slate-400 mb-3">Token Balances</div>
                    <div className="space-y-2">
                        {tokenBalances.map((token: { symbol: string, balance: bigint }, index) => (
                            <div key={index}
                                 className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2">
                                <span className="text-white">{token.symbol}</span>
                                <span className="text-slate-300">{formatEther(token.balance)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
