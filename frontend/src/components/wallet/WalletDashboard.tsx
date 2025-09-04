import React, {useState} from 'react';
import {useUnifiedWallet} from '../../hooks/useUnifiedWallet';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {useSessionKeys} from '../../hooks/useSessionKeys';
import {useTransactionHistoryBackend} from '../../hooks/useTransactionHistoryBackend';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {Spinner} from '../ui/Spinner';
import {Address, formatEther, parseEther} from 'viem';

export const WalletDashboard: React.FC = () => {
    const {
        isConnected,
        walletType,
        userAddress,
        userInfo,
        balance,
        disconnect
    } = useUnifiedWallet();

    const {
        token: authToken,
    } = useBackendSmartAccount();

    const {
        sessionKeys,
        isLoading: sessionLoading,
        createSessionKey,
        revokeSessionKey,
        validateSessionKey,
        activeSessionKeys,
        expiredSessionKeys,
        totalSessionKeys
    } = useSessionKeys();

    // Recovery functionality temporarily disabled

    const {
        sendTransaction: sendTransactionBackend,
        transactions,
        isLoading: txLoading,
        isEstimating,
        gasEstimate,
        estimateGas,
        retryTransaction,
        fetchTransactionHistory,
        clearHistory,
        hasFailedTransactions,
        failedTransactions
    } = useTransactionHistoryBackend();

    // MetaMask transactions temporarily disabled
    const sendMetaMaskTransaction = async () => {
        throw new Error('MetaMask transactions not available');
    };
    const metaMaskTxLoading = false;

    // Transaction form state
    const [txTo, setTxTo] = useState('');
    const [txValue, setTxValue] = useState('');
    const [txData, setTxData] = useState('0x');
    const [lastTxResult, setLastTxResult] = useState<any>(null);

    // Session key form state
    const [sessionSpendingLimit, setSessionSpendingLimit] = useState('0.1');


    if (!isConnected) {
        return (
            <Card className="p-6">
                <p className="text-center text-gray-600">Please connect your wallet first</p>
            </Card>
        );
    }

    const handleEstimateGas = async () => {
        if (!txTo.trim() || !userAddress) return;

        try {
            const value = txValue ? parseEther(txValue) : BigInt(0);
            await estimateGas(txTo as Address, txData || '0x', value);
        } catch (err) {
            console.error('Gas estimation failed:', err);
        }
    };

    const handleSendTransaction = async () => {
        if (!txTo.trim() || !userAddress) return;

        try {
            if (walletType === 'email') {
                // Use backend transaction for email wallets
                if (!authToken) {
                    throw new Error('Authentication token not available');
                }
                const value = txValue ? parseEther(txValue) : BigInt(0);
                const result = await sendTransactionBackend(
                    authToken,
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

    const handleRetryTransaction = async (transactionId: string) => {
        try {
            const result = await retryTransaction(transactionId);
            if (result) {
                setLastTxResult(result);
            }
        } catch (err) {
            console.error('Transaction retry failed:', err);
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
                            {balance ? `${formatEther(typeof balance === 'string' ? BigInt(balance) : balance)} ETH` : '0 ETH'}
                        </p>
                    </div>
                </div>

                {walletType === 'metamask' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>MetaMask Mode:</strong> You're connected with MetaMask.
                            Some advanced features like session keys are only available with email wallets.
                        </p>
                    </div>
                )}

                {walletType === 'email' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            ✨ <strong>Smart Account Mode:</strong> You're using an ERC-4337 smart account with
                            gasless transactions and session keys powered by our backend API.
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

                    {/* Gas Estimation - Only for email wallets */}
                    {walletType === 'email' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-blue-800">Gas Estimation</h4>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleEstimateGas}
                                    disabled={!txTo.trim() || isEstimating}
                                    loading={isEstimating}
                                >
                                    Estimate Gas
                                </Button>
                            </div>
                            {gasEstimate && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Gas Estimate:</span>
                                        <span className="font-mono">{gasEstimate.gasEstimate}</span>
                                    </div>
                                    {gasEstimate.maxFeePerGas && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Max Fee Per Gas:</span>
                                            <span className="font-mono">{gasEstimate.maxFeePerGas} wei</span>
                                        </div>
                                    )}
                                    {gasEstimate.maxPriorityFeePerGas && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Priority Fee:</span>
                                            <span className="font-mono">{gasEstimate.maxPriorityFeePerGas} wei</span>
                                        </div>
                                    )}
                                    <div className="text-xs text-blue-600 mt-2">
                                        💡 Gas fees will be sponsored by Alchemy paymaster
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Button
                            onClick={handleSendTransaction}
                            disabled={!txTo.trim() || txLoading || metaMaskTxLoading}
                            loading={txLoading || metaMaskTxLoading}
                            className="flex-1"
                        >
                            {walletType === 'metamask' ? 'Send via MetaMask' : 'Send Transaction'}
                        </Button>
                        {walletType === 'email' && (
                            <Button
                                variant="outline"
                                onClick={() => authToken && fetchTransactionHistory(authToken)}
                                disabled={txLoading}
                                size="sm"
                            >
                                Refresh History
                            </Button>
                        )}
                    </div>
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Transaction History</h2>
                    <div className="flex items-center space-x-2">
                        {hasFailedTransactions && walletType === 'email' && (
                            <div
                                className="flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                <span>⚠️</span>
                                <span>{failedTransactions.length} failed</span>
                            </div>
                        )}
                        {walletType === 'email' && transactions.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearHistory}
                            >
                                Clear History
                            </Button>
                        )}
                    </div>
                </div>
                {transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-3">No transactions yet</p>
                        {walletType === 'email' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => authToken && fetchTransactionHistory(authToken)}
                                disabled={txLoading}
                                loading={txLoading}
                            >
                                Load Transaction History
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 10).map((tx) => (
                            <div key={tx.hash} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <p className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                                {tx.hash.slice(0, 16)}...
                                            </p>
                                            <p className={`text-xs font-medium px-2 py-1 rounded ${
                                                tx.status === 'success' ? 'bg-green-100 text-green-800' :
                                                    tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {tx.status.toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <div>
                                                <span className="text-gray-600">To:</span>
                                                <span className="ml-2 font-mono text-xs">{tx.to.slice(0, 12)}...</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Value:</span>
                                                <span className="ml-2 font-mono">{tx.value} wei</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Time:</span>
                                                <span className="ml-2">{new Date(tx.timestamp).toLocaleString()}</span>
                                            </div>
                                            {tx.userOpHash && (
                                                <div>
                                                    <span className="text-gray-600">UserOp:</span>
                                                    <span
                                                        className="ml-2 font-mono text-xs">{tx.userOpHash.slice(0, 10)}...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 ml-4">
                                        {tx.hash && (
                                            <a
                                                href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs"
                                            >
                                                View on Explorer →
                                            </a>
                                        )}
                                        {tx.status === 'failed' && walletType === 'email' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRetryTransaction(tx.hash)}
                                                disabled={txLoading}
                                                className="text-xs"
                                            >
                                                Retry
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {transactions.length > 10 && (
                            <div className="text-center pt-4">
                                <p className="text-sm text-gray-600">
                                    Showing latest 10 of {transactions.length} transactions
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => authToken && fetchTransactionHistory(authToken, 50)}
                                    disabled={txLoading}
                                    className="mt-2"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* Session Keys - Only for email wallets */}
            {walletType === 'email' && (
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Session Keys</h2>
                        <div className="flex items-center space-x-3 text-sm">
                            {totalSessionKeys > 0 && (
                                <>
                                    <div className="flex items-center space-x-1 text-green-600">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>{activeSessionKeys.length} Active</span>
                                    </div>
                                    {expiredSessionKeys.length > 0 && (
                                        <div className="flex items-center space-x-1 text-red-600">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <span>{expiredSessionKeys.length} Expired</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Create Session Key */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-medium mb-2 text-blue-800">Create New Session Key</h3>
                        <p className="text-sm text-blue-600 mb-3">
                            Session keys allow automated transactions within spending limits
                        </p>
                        <div className="space-y-3">
                            <div className="flex space-x-3">
                                <Input
                                    placeholder="Spending limit (ETH)"
                                    value={sessionSpendingLimit}
                                    onChange={(e) => setSessionSpendingLimit(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleCreateSessionKey}
                                    disabled={sessionLoading || !sessionSpendingLimit.trim()}
                                    loading={sessionLoading}
                                >
                                    Create Key
                                </Button>
                            </div>
                            <div className="text-xs text-blue-600">
                                Default expiry: 24 hours • Target: Your smart account
                            </div>
                        </div>
                    </div>

                    {/* Session Keys List */}
                    {sessionLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="flex items-center space-x-2">
                                <Spinner size="sm"/>
                                <span className="text-gray-600">Loading session keys...</span>
                            </div>
                        </div>
                    ) : sessionKeys.length === 0 ? (
                        <div className="text-center py-8">
                            <div
                                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                🔑
                            </div>
                            <p className="text-gray-600 mb-2">No session keys created yet</p>
                            <p className="text-sm text-gray-500">
                                Create session keys to enable automated transactions
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sessionKeys.map((key) => {
                                const isExpired = key.expiryTime <= Math.floor(Date.now() / 1000);
                                const timeRemaining = key.expiryTime - Math.floor(Date.now() / 1000);
                                const hoursRemaining = Math.max(0, Math.floor(timeRemaining / 3600));

                                return (
                                    <div key={key.key} className={`p-4 border rounded-lg ${
                                        key.isActive && !isExpired ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                                    }`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <p className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                                        {key.key.slice(0, 16)}...
                                                    </p>
                                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                        key.isActive && !isExpired
                                                            ? 'bg-green-100 text-green-800'
                                                            : isExpired
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {key.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Spending Limit:</span>
                                                        <span className="ml-2 font-mono">{key.spendingLimit} wei</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Expires:</span>
                                                        <span className="ml-2">
                                                            {isExpired ? 'Expired' : `${hoursRemaining}h remaining`}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-600">Created:</span>
                                                        <span className="ml-2 text-xs">
                                                            {new Date(key.expiryTime * 1000).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2 ml-4">
                                                {key.isActive && !isExpired && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => validateSessionKey(key.key)}
                                                            className="text-xs"
                                                        >
                                                            Validate
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => revokeSessionKey(key.key)}
                                                            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            Revoke
                                                        </Button>
                                                    </>
                                                )}
                                                {isExpired && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => revokeSessionKey(key.key)}
                                                        className="text-xs text-gray-600"
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Session Key Info */}
                    <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
                        <p className="text-xs text-gray-600 mb-2">
                            <strong>About Session Keys:</strong> Session keys enable gasless, automated transactions
                            within defined spending limits. They're perfect for recurring payments, DeFi interactions,
                            or giving limited access to dApps.
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>✓ Spending limits enforced</span>
                            <span>✓ Time-based expiration</span>
                            <span>✓ Revocable anytime</span>
                        </div>
                    </div>
                </Card>
            )}

        </div>
    );
};
