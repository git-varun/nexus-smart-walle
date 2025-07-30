import React, {useState} from 'react';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {Card} from '../ui/Card';
import {Spinner} from '../ui/Spinner';

export const EmailWalletConnect: React.FC = () => {
    const {
        isAuthenticated,
        user,
        smartAccountAddress,
        loading,
        error,
        connect,
        disconnect,
    } = useBackendSmartAccount();

    const [email, setEmail] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        if (!email.trim()) {
            return;
        }

        setIsConnecting(true);
        try {
            await connect(email.trim());
            setEmail('');
        } catch (err) {
            console.error('Connection failed:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (err) {
            console.error('Disconnect failed:', err);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2">
                    <Spinner size="sm"/>
                    <span>Loading wallet...</span>
                </div>
            </Card>
        );
    }

    if (isAuthenticated && user) {
        return (
            <Card className="p-6 max-w-md mx-auto">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Connected</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>

                    {smartAccountAddress && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Smart Account Address</p>
                            <p className="text-sm font-mono break-all">{smartAccountAddress}</p>
                        </div>
                    )}

                    <Button
                        onClick={handleDisconnect}
                        variant="secondary"
                        className="w-full"
                    >
                        Disconnect
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 max-w-md mx-auto">
            <div className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
                    <p className="text-sm text-gray-600">
                        Enter your email to create or access your smart account
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleConnect();
                            }
                        }}
                        disabled={isConnecting}
                    />

                    <Button
                        onClick={handleConnect}
                        disabled={!email.trim() || isConnecting}
                        loading={isConnecting}
                        className="w-full"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        This will create a smart account using Alchemy's Account Kit
                    </p>
                </div>
            </div>
        </Card>
    );
};
