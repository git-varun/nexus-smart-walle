// frontend/src/components/transaction/TransactionInterface.tsx
import React, {useState} from 'react';
import {isAddress, parseEther} from 'viem';
import {useSmartAccount} from '@/hooks/useSmartAccount.ts';
import {useToast} from '@/hooks/useToast.ts';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {TransactionHistory} from './TransactionHistory';

export const TransactionInterface: React.FC = () => {
    const smartAccountHook = useSmartAccount();
    const {
        executeTransaction,
        executeBatchTransaction,
        isExecuting,
        smartAccount,
        smartAccountClient,
        smartAccountAddress,
        isSmartAccountReady
    } = smartAccountHook;
    const {toast} = useToast();

    console.log('💸 TransactionInterface render:', {
        hasSmartAccount: !!smartAccount,
        hasSmartAccountClient: !!smartAccountClient,
        smartAccountAddress,
        isExecuting
    });

    const [singleTx, setSingleTx] = useState({
        target: '',
        value: '',
        data: '0x'
    });

    const [batchTxs, setBatchTxs] = useState([
        {target: '', value: '', data: '0x'}
    ]);

    const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

    const handleSingleTransaction = async () => {
        if (!isAddress(singleTx.target)) {
            toast({
                title: 'Invalid Address',
                description: 'Please enter a valid target address',
                variant: 'error'
            });
            return;
        }

        try {
            const value = singleTx.value ? parseEther(singleTx.value) : 0n;
            await executeTransaction({
                target: singleTx.target,
                value: value.toString(),
                data: singleTx.data
            });

            // Reset form
            setSingleTx({target: '', value: '', data: '0x'});
        } catch (error) {
            console.error('Transaction failed:', error);
            toast({
                title: 'Transaction Failed',
                description: 'Transaction execution failed. Please try again.',
                variant: 'error'
            });
        }
    };

    const handleBatchTransaction = async () => {
        const validTxs = batchTxs.filter(tx => isAddress(tx.target));

        if (validTxs.length === 0) {
            toast({
                title: 'No Valid Transactions',
                description: 'Please add at least one transaction with a valid address',
                variant: 'error'
            });
            return;
        }

        try {
            const formattedTxs = validTxs.map(tx => ({
                target: tx.target,
                value: tx.value ? parseEther(tx.value).toString() : '0',
                data: tx.data
            }));

            await executeBatchTransaction({transactions: formattedTxs});

            // Reset form
            setBatchTxs([{target: '', value: '', data: '0x'}]);
        } catch (error) {
            console.error('Batch transaction failed:', error);
            toast({
                title: 'Batch Transaction Failed',
                description: 'Batch transaction execution failed. Please try again.',
                variant: 'error'
            });
        }
    };

    const addBatchTransaction = () => {
        setBatchTxs([...batchTxs, {target: '', value: '', data: '0x'}]);
    };

    const removeBatchTransaction = (index: number) => {
        setBatchTxs(batchTxs.filter((_, i) => i !== index));
    };

    const updateBatchTransaction = (index: number, field: string, value: string) => {
        const updated = [...batchTxs];
        updated[index] = {...updated[index], [field]: value};
        setBatchTxs(updated);
    };

    // Show warning if smart account is not ready
    if (!isSmartAccountReady()) {
        return (
            <div className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Send Transaction</h2>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-yellow-800">
                            <div
                                className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-medium">Smart Account Not Ready</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-2">
                            Please create your smart account first to enable gasless transactions.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Send Transaction</h2>

                {/* Tab Selector */}
                <div className="flex space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'single'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Single Transaction
                    </button>
                    <button
                        onClick={() => setActiveTab('batch')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'batch'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Batch Transaction
                    </button>
                </div>

                {/* Single Transaction */}
                {activeTab === 'single' && (
                    <div className="space-y-4">
                        <Input
                            label="Target Address"
                            placeholder="0x..."
                            value={singleTx.target}
                            onChange={(e) => setSingleTx({...singleTx, target: e.target.value})}
                        />

                        <Input
                            label="Value (ETH)"
                            placeholder="0.0"
                            value={singleTx.value}
                            onChange={(e) => setSingleTx({...singleTx, value: e.target.value})}
                        />

                        <Input
                            label="Call Data"
                            placeholder="0x"
                            value={singleTx.data}
                            onChange={(e) => setSingleTx({...singleTx, data: e.target.value})}
                        />

                        <Button
                            onClick={handleSingleTransaction}
                            loading={isExecuting}
                            variant="primary"
                            className="w-full"
                        >
                            Send Transaction (Gasless)
                        </Button>
                    </div>
                )}

                {/* Batch Transaction */}
                {activeTab === 'batch' && (
                    <div className="space-y-4">
                        {batchTxs.map((tx, index) => (
                            <div key={index} className="bg-slate-800/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Transaction {index + 1}
                  </span>
                                    {batchTxs.length > 1 && (
                                        <Button
                                            onClick={() => removeBatchTransaction(index)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                <Input
                                    label="Target Address"
                                    placeholder="0x..."
                                    value={tx.target}
                                    onChange={(e) => updateBatchTransaction(index, 'target', e.target.value)}
                                />

                                <Input
                                    label="Value (ETH)"
                                    placeholder="0.0"
                                    value={tx.value}
                                    onChange={(e) => updateBatchTransaction(index, 'value', e.target.value)}
                                />

                                <Input
                                    label="Call Data"
                                    placeholder="0x"
                                    value={tx.data}
                                    onChange={(e) => updateBatchTransaction(index, 'data', e.target.value)}
                                />
                            </div>
                        ))}

                        <div className="flex space-x-3">
                            <Button
                                onClick={addBatchTransaction}
                                variant="outline"
                                className="flex-1"
                            >
                                Add Transaction
                            </Button>

                            <Button
                                onClick={handleBatchTransaction}
                                loading={isExecuting}
                                variant="primary"
                                className="flex-1"
                            >
                                Send Batch (Gasless)
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Transaction History */}
            <TransactionHistory/>
        </div>
    );
};
