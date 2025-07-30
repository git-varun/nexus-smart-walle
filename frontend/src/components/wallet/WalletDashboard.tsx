import React, {useState} from 'react';
import {useUnifiedWallet} from '../../hooks/useUnifiedWallet';
import {useSessionKeys} from '../../hooks/useSessionKeys';
import {useRecovery} from '../../hooks/useRecovery';
import {useTransactionHistoryBackend} from '../../hooks/useTransactionHistoryBackend';
import {useMetaMaskTransactions} from '../../hooks/useMetaMaskTransactions';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {Spinner} from '../ui/Spinner';
import {Address, parseEther} from 'viem';

export const WalletDashboard: React.FC = () => {
    const {
        isConnected,
        walletType,
        userAddress,
        userInfo,
        emailBalance,
        disconnect
    } = useUnifiedWallet();

    const {
        sessionKeys,
        isLoading: sessionLoading,
        createSessionKey,
        revokeSessionKey
    } = useSessionKeys();

    const {
        initiateRecovery,
        isLoading: recoveryLoading
    } = useRecovery();

    const {
        sendTransaction: sendTransactionBackend,
        transactions,
        isLoading: txLoading
    } = useTransactionHistoryBackend();

    const {
        sendMetaMaskTransaction,
        isLoading: metaMaskTxLoading,
        lastTxHash: metaMaskTxHash,
        receipt: metaMaskReceipt,
        sendError: metaMaskError
    } = useMetaMaskTransactions();

    // Transaction form state
    const [txTo, setTxTo] = useState('');
    const [txValue, setTxValue] = useState('');
    const [txData, setTxData] = useState('0x');
    const [lastTxResult, setLastTxResult] = useState<any>(null);

    // Session key form state
    const [sessionSpendingLimit, setSessionSpendingLimit] = useState('0.1');

    // Recovery form state
    const [recoveryNewOwner, setRecoveryNewOwner] = useState('');

    if (!isConnected) {
        return (
            <Card className="p-6">
                <p className="text-center text-gray-600">Please connect your wallet first</p>
            </Card>
        );
    }

    const handleSendTransaction = async () => {
        if (!txTo.trim() || !userAddress) return;

        try {
            if (walletType === 'email') {
                // Use backend transaction for email wallets
                const value = txValue ? parseEther(txValue) : BigInt(0);
                const result = await sendTransactionBackend(
                    txTo as Address,
                    txData || '0x',
                    value
                );
                setLastTxResult(result);
            } else if (walletType === 'metamask') {
                // Use MetaMask for direct transactions
                console.log('🦊 Sending MetaMask transaction...');
                const result = await sendMetaMaskTransaction(
                    txTo,
                    txValue || '0',
                    txData || '0x'
                );

                setLastTxResult({
                    hash: result.hash,
                    success: result.success,
                    isMetaMaskTx: true
                });
            }

            setTxTo('');
            setTxValue('');
            setTxData('0x');
        } catch (err) {
            console.error('Transaction failed:', err);
            setLastTxResult({error: err});
        }
    };

    const handleCreateSessionKey = async () => {
        try {
            await createSessionKey({
                sessionKey: `session_${Date.now()}`,
                spendingLimit: parseEther(sessionSpendingLimit).toString(),
                dailyLimit: parseEther(sessionSpendingLimit).toString(),
                allowedTargets: [userAddress || ''],
                expiryTime: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
            });
            setSessionSpendingLimit('0.1');
        } catch (err) {
            console.error('Session key creation failed:', err);
        }
    };

    const handleInitiateRecovery = async () => {
        if (!recoveryNewOwner.trim()) return;

        try {
            await initiateRecovery(recoveryNewOwner);
            setRecoveryNewOwner('');
        } catch (err) {
            console.error('Recovery initiation failed:', err);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Account Info */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Account Information</h2>
                    <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            walletType === 'metamask'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            {walletType === 'metamask' ? '🦊 MetaMask' : '📧 Email Wallet'}
                        </div>
                        <Button
                            onClick={disconnect}
                            variant="outline"
                            size="sm"
                        >
                            Disconnect
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {walletType === 'email' && userInfo?.type === 'email' && (
                        <>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-mono">{userInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">User ID</p>
                                <p className="font-mono text-xs">{userInfo.userId}</p>
                            </div>
                        </>
                    )}

                    {walletType === 'metamask' && userInfo?.type === 'metamask' && (
                        <>
                            <div>
                                <p className="text-sm text-gray-600">Wallet Type</p>
                                <p className="font-mono">{userInfo.connector}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Connected Account</p>
                                <p className="font-mono text-xs break-all">{userInfo.address}</p>
                            </div>
                        </>
                    )}

                    <div>
                        <p className="text-sm text-gray-600">
                            {walletType === 'email' ? 'Smart Account Address' : 'Wallet Address'}
                        </p>
                        <p className="font-mono text-xs break-all">{userAddress}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Balance</p>
                        <p className="font-mono">
                            {walletType === 'email'
                                ? (emailBalance ? `${emailBalance.toString()} wei` : '0 wei')
                                : 'Connect to view balance'
                            }
                        </p>
                    </div>
                </div>

                {walletType === 'metamask' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>MetaMask Mode:</strong> You're connected with MetaMask.
                            Some advanced features like session keys and recovery are only available with email wallets.
                        </p>
                    </div>
                )}

                {walletType === 'email' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            ✨ <strong>Smart Account Mode:</strong> You're using an ERC-4337 smart account with
                            gasless transactions, session keys, and recovery features powered by our backend API.
                        </p>
                    </div>
                )}
            </Card>

            {/* Send Transaction */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Send Transaction</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">To Address</label>
                        <Input
                            placeholder="0x..."
                            value={txTo}
                            onChange={(e) => setTxTo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Value (ETH)</label>
                        <Input
                            placeholder="0.1"
                            value={txValue}
                            onChange={(e) => setTxValue(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Data (optional)</label>
                        <Input
                            placeholder="0x"
                            value={txData}
                            onChange={(e) => setTxData(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleSendTransaction}
                        disabled={!txTo.trim() || txLoading || metaMaskTxLoading}
                        loading={txLoading || metaMaskTxLoading}
                    >
                        {walletType === 'metamask' ? 'Send via MetaMask' : 'Send Transaction'}
                    </Button>
                </div>
            </Card>

            {/* Last Transaction Result */}
            {lastTxResult && (
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Last Transaction Result</h2>
                    {lastTxResult.error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 font-medium">Transaction Failed</p>
                            <p className="text-sm text-red-600 mt-1">
                                {lastTxResult.error.message || 'Unknown error occurred'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium mb-3">✅ Transaction Successful!</p>

                            <div className="space-y-3 text-sm">
                                {lastTxResult.hash && (
                                    <div>
                                        <span className="text-gray-600">Transaction Hash:</span>
                                        <div className="font-mono text-xs break-all bg-white p-2 rounded border">
                                            {lastTxResult.hash}
                                        </div>
                                        <a
                                            href={`https://sepolia.basescan.org/tx/${lastTxResult.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
                                        >
                                            View on Base Sepolia Explorer →
                                        </a>
                                    </div>
                                )}

                                {lastTxResult.userOpHash && !lastTxResult.isMetaMaskTx && (
                                    <div>
                                        <span className="text-gray-600">UserOperation Hash:</span>
                                        <div className="font-mono text-xs break-all bg-white p-2 rounded border">
                                            {lastTxResult.userOpHash}
                                        </div>
                                    </div>
                                )}

                                {lastTxResult.gasUsed && (
                                    <div>
                                        <span className="text-gray-600">Gas Used:</span>
                                        <span className="ml-2 font-mono">{lastTxResult.gasUsed}</span>
                                    </div>
                                )}

                                {lastTxResult.isMetaMaskTx ? (
                                    <div
                                        className="flex items-center space-x-2 text-orange-700 bg-orange-100 px-3 py-2 rounded">
                                        🦊 <span className="text-sm">Transaction sent via MetaMask - Gas paid by your wallet</span>
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center space-x-2 text-blue-700 bg-blue-100 px-3 py-2 rounded">
                                        💳 <span className="text-sm">Gas fees sponsored by Alchemy paymaster</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setLastTxResult(null)}
                                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                            >
                                ✕ Dismiss
                            </button>
                        </div>
                    )}
                </Card>
            )}

            {/* Transaction History */}
            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                {transactions.length === 0 ? (
                    <p className="text-gray-600">No transactions yet</p>
                ) : (
                    <div className="space-y-2">
                        {transactions.slice(0, 5).map((tx) => (
                            <div key={tx.hash} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-mono text-xs">{tx.hash.slice(0, 20)}...</p>
                                        <p className="text-sm text-gray-600">To: {tx.to.slice(0, 10)}...</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${
                                            tx.status === 'success' ? 'text-green-600' :
                                                tx.status === 'failed' ? 'text-red-600' :
                                                    'text-yellow-600'
                                        }`}>
                                            {tx.status.toUpperCase()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(tx.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Session Keys - Only for email wallets */}
            {walletType === 'email' && (
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Session Keys</h2>

                    {/* Create Session Key */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium mb-3">Create New Session Key</h3>
                        <div className="flex space-x-3">
                            <Input
                                placeholder="Spending limit (ETH)"
                                value={sessionSpendingLimit}
                                onChange={(e) => setSessionSpendingLimit(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleCreateSessionKey}
                                disabled={sessionLoading}
                                loading={sessionLoading}
                            >
                                Create
                            </Button>
                        </div>
                    </div>

                    {/* Session Keys List */}
                    {sessionLoading ? (
                        <div className="flex justify-center">
                            <Spinner/>
                        </div>
                    ) : sessionKeys.length === 0 ? (
                        <p className="text-gray-600">No session keys created yet</p>
                    ) : (
                        <div className="space-y-3">
                            {sessionKeys.map((key) => (
                                <div key={key.key} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-mono text-xs">{key.key}</p>
                                            <p className="text-sm text-gray-600">
                                                Limit: {key.spendingLimit} wei
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Expires: {new Date(key.expiryTime * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                        key.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                                            {key.isActive && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => revokeSessionKey(key.key)}
                                                >
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* Recovery - Only for email wallets */}
            {walletType === 'email' && (
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Account Recovery</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">New Owner Address</label>
                            <Input
                                placeholder="0x..."
                                value={recoveryNewOwner}
                                onChange={(e) => setRecoveryNewOwner(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleInitiateRecovery}
                            disabled={!recoveryNewOwner.trim() || recoveryLoading}
                            loading={recoveryLoading}
                        >
                            Initiate Recovery
                        </Button>
                        <p className="text-xs text-gray-500">
                            This will start a recovery process with default guardians
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};
