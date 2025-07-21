// frontend/src/components/wallet/WalletConnect.tsx
import React, {useState} from 'react';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useSmartAccount} from '../../hooks/useSmartAccount';
import {Button} from '../ui/Button';
import {SimpleProgressModal} from './SimpleProgressModal';

export const WalletConnect: React.FC = () => {
    const {
        isConnected,
        isCreatingAccount,
        createSmartAccount,
        smartAccountAddress,
        creationProgress
    } = useSmartAccount();
    const [showCreationModal, setShowCreationModal] = useState(false);

    // Auto-open modal when creation starts
    React.useEffect(() => {
        if (creationProgress.isProcessing && !showCreationModal) {
            setShowCreationModal(true);
        }
    }, [creationProgress.isProcessing, showCreationModal]);

    // Debug WalletConnect state
    console.log('🔌 WalletConnect render state:', {
        isConnected,
        smartAccountAddress: smartAccountAddress || 'empty',
        isCreatingAccount,
        showCreationModal
    });

    return (
        <div className="flex items-center space-x-4">
            <ConnectButton/>

            {isConnected && !smartAccountAddress && (
                <Button
                    onClick={() => {
                        console.log('🔥 Button clicked! Opening modal and creating smart account...');
                        setShowCreationModal(true);
                        createSmartAccount();
                    }}
                    loading={isCreatingAccount}
                    variant="primary"
                >
                    {creationProgress.isProcessing ?
                        `Creating... (${creationProgress.completedSteps}/${creationProgress.totalSteps})` :
                        'Create Smart Account'}
                </Button>
            )}


            {smartAccountAddress && (
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-slate-300">Smart Account Ready</span>
                </div>
            )}


            {/* Simple Progress Modal */}
            <SimpleProgressModal
                isOpen={showCreationModal}
                onClose={() => setShowCreationModal(false)}
                smartAccountAddress={smartAccountAddress}
            />

            {/* Smart Account Creation Modal (complex version) */}
            {/* <SmartAccountCreationModal
                isOpen={showCreationModal}
                onClose={() => setShowCreationModal(false)}
            /> */}
        </div>
    );
};
