// frontend/src/components/analytics/AnalyticsDashboard.tsx
import React, {useState} from 'react';
import {useSmartAccount} from '@/hooks/useSmartAccount.ts';
import {useAnalytics} from '@/hooks/useAnalytics.ts';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {formatEther} from 'viem';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
    const {smartAccountAddress} = useSmartAccount();
    const {
        analytics,
        isLoading,
        refreshAnalytics,
        timeRange,
        setTimeRange
    } = useAnalytics();

    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'gas' | 'modules'>('overview');

    if (!smartAccountAddress) {
        return (
            <Card className="p-6">
                <div className="text-center text-slate-400">
                    Connect your smart account to view analytics
                </div>
            </Card>
        );
    }

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                <div className="flex items-center space-x-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <Button onClick={refreshAnalytics} loading={isLoading} variant="outline">
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
                {[
                    {id: 'overview', label: 'Overview'},
                    {id: 'transactions', label: 'Transactions'},
                    {id: 'gas', label: 'Gas Usage'},
                    {id: 'modules', label: 'Modules'}
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Key Metrics */}
                    <Card className="p-6">
                        <div className="text-sm text-slate-400 mb-2">Total Transactions</div>
                        <div className="text-2xl font-bold text-white">{analytics?.totalTransactions || 0}</div>
                        <div className="text-sm text-green-400 mt-1">
                            +{analytics?.transactionGrowth || 0}% from last period
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm text-slate-400 mb-2">Gas Saved</div>
                        <div className="text-2xl font-bold text-white">
                            {analytics?.gasSaved ? formatEther(BigInt(analytics.gasSaved)) : '0'} ETH
                        </div>
                        <div className="text-sm text-blue-400 mt-1">
                            ${analytics?.gasSavedUSD || 0} USD saved
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm text-slate-400 mb-2">Active Sessions</div>
                        <div className="text-2xl font-bold text-white">{analytics?.activeSessions || 0}</div>
                        <div className="text-sm text-slate-400 mt-1">
                            {analytics?.totalSessions || 0} total created
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="text-sm text-slate-400 mb-2">Success Rate</div>
                        <div className="text-2xl font-bold text-white">{analytics?.successRate || 0}%</div>
                        <div className="text-sm text-slate-400 mt-1">
                            {analytics?.failedTransactions || 0} failed
                        </div>
                    </Card>

                    {/* Transaction Volume Chart */}
                    <Card className="p-6 md:col-span-2 lg:col-span-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics?.transactionHistory || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                <XAxis dataKey="date" stroke="#9CA3AF"/>
                                <YAxis stroke="#9CA3AF"/>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                        color: '#F9FAFB'
                                    }}
                                />
                                <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={2}/>
                                <Line type="monotone" dataKey="gasless" stroke="#10B981" strokeWidth={2}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Top Interactions */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Top Interactions</h3>
                        <div className="space-y-3">
                            {analytics?.topInteractions?.map((interaction, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-medium">{interaction.contract}</div>
                                        <div className="text-sm text-slate-400">{interaction.method}</div>
                                    </div>
                                    <div className="text-slate-300">{interaction.count}</div>
                                </div>
                            )) || (
                                <div className="text-slate-400 text-sm">No interactions yet</div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Transaction Types</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics?.transactionTypes || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {analytics?.transactionTypes?.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Success vs Failed</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics?.successFailureData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                <XAxis dataKey="date" stroke="#9CA3AF"/>
                                <YAxis stroke="#9CA3AF"/>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="successful" fill="#10B981"/>
                                <Bar dataKey="failed" fill="#EF4444"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 text-slate-400">Hash</th>
                                    <th className="text-left py-2 text-slate-400">Type</th>
                                    <th className="text-left py-2 text-slate-400">Status</th>
                                    <th className="text-left py-2 text-slate-400">Gas</th>
                                    <th className="text-left py-2 text-slate-400">Time</th>
                                </tr>
                                </thead>
                                <tbody>
                                {analytics?.recentTransactions?.map((tx, index) => (
                                    <tr key={index} className="border-b border-slate-800">
                                        <td className="py-2 text-white font-mono">
                                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                                        </td>
                                        <td className="py-2 text-slate-300">{tx.type}</td>
                                        <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === 'success'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                                        </td>
                                        <td className="py-2 text-slate-300">{tx.gasUsed || 'Gasless'}</td>
                                        <td className="py-2 text-slate-400">{tx.timestamp}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Gas Tab */}
            {activeTab === 'gas' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <div className="text-sm text-slate-400 mb-2">Total Gas Saved</div>
                            <div className="text-2xl font-bold text-white">
                                {analytics?.totalGasSaved ? formatEther(BigInt(analytics.totalGasSaved)) : '0'} ETH
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="text-sm text-slate-400 mb-2">Average Gas per Tx</div>
                            <div className="text-2xl font-bold text-white">
                                {analytics?.averageGasPerTx || 0}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="text-sm text-slate-400 mb-2">Paymaster Coverage</div>
                            <div className="text-2xl font-bold text-white">
                                {analytics?.paymasterCoverage || 0}%
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Gas Usage Over Time</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={analytics?.gasUsageHistory || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                <XAxis dataKey="date" stroke="#9CA3AF"/>
                                <YAxis stroke="#9CA3AF"/>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line type="monotone" dataKey="gasUsed" stroke="#3B82F6" strokeWidth={2}/>
                                <Line type="monotone" dataKey="gasSaved" stroke="#10B981" strokeWidth={2}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Module Usage</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics?.moduleUsage || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                                    <XAxis dataKey="name" stroke="#9CA3AF"/>
                                    <YAxis stroke="#9CA3AF"/>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="usage" fill="#8B5CF6"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Session Key Activity</h3>
                            <div className="space-y-4">
                                {analytics?.sessionKeyActivity?.map((session, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div>
                                            <div className="text-white font-medium">
                                                {session.key.slice(0, 10)}...{session.key.slice(-6)}
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                {session.usageCount} transactions
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white">{formatEther(BigInt(session.totalValue))} ETH
                                            </div>
                                            <div className="text-sm text-slate-400">{session.status}</div>
                                        </div>
                                    </div>
                                )) || (
                                    <div className="text-slate-400 text-sm">No session key activity</div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Module Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 text-slate-400">Module</th>
                                    <th className="text-left py-2 text-slate-400">Version</th>
                                    <th className="text-left py-2 text-slate-400">Usage</th>
                                    <th className="text-left py-2 text-slate-400">Gas Efficiency</th>
                                    <th className="text-left py-2 text-slate-400">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {analytics?.modulePerformance?.map((module, index) => (
                                    <tr key={index} className="border-b border-slate-800">
                                        <td className="py-2 text-white">{module.name}</td>
                                        <td className="py-2 text-slate-300">{module.version}</td>
                                        <td className="py-2 text-slate-300">{module.usage}</td>
                                        <td className="py-2 text-slate-300">{module.gasEfficiency}</td>
                                        <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                            module.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {module.status}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
