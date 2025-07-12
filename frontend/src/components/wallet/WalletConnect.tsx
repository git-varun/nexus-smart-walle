// frontend/src/components/wallet/WalletConnect.tsx
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSmartAccount } from '../../hooks/useSmartAccount';
import { Button } from '../ui/Button';

export const WalletConnect: React.FC = () => {
  const { isConnected, isCreatingAccount, createSmartAccount, smartAccountAddress } = useSmartAccount();

  return (
    <div className="flex items-center space-x-4">
      <ConnectButton />

      {isConnected && !smartAccountAddress && (
        <Button
          onClick={createSmartAccount}
          loading={isCreatingAccount}
          variant="primary"
        >
          Create Smart Account
        </Button>
      )}

      {smartAccountAddress && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-slate-300">Smart Account Ready</span>
        </div>
      )}
    </div>
  );
};
