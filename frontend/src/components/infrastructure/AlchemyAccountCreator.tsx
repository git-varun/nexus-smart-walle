// Simplified Alchemy-only account creator component
import React, {useState} from 'react';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';

export const AlchemyAccountCreator: React.FC = () => {
    const [email, setEmail] = useState('');
    const {
        smartAccountAddress,
        isAuthenticated,
        user,
        connect,
        disconnect,
        loading,
        error
    } = useBackendSmartAccount();

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            console.warn('⚠️ No email provided');
            return;
        }

        try {
            console.log('🔄 Starting authentication process...');
            await connect(email.trim());
            setEmail('');
        } catch (error) {
            console.error('❌ Authentication failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await disconnect();
            setEmail('');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // If user is authenticated and has smart account
    if (isAuthenticated && smartAccountAddress) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            ⚡ Alchemy Smart Account Active
                        </h3>
                        <div className="space-y-1 text-sm text-slate-400">
                            <p>User: {user?.email}</p>
                            <p>Account: {smartAccountAddress.slice(0, 8)}...{smartAccountAddress.slice(-6)}</p>
                            <p>Chain: Base Sepolia</p>
                        </div>
                    </div>
                    <div className="text-green-500 text-3xl">✅</div>
                </div>

                <div className="flex space-x-3">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                    >
                        Logout
                    </Button>
                </div>
            </Card>
        );
    }

    // Show loading state
    if (loading) {
        return (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔄</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Processing...
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Please wait while we process your request
                    </p>
                </div>
            </Card>
        );
    }

    // Main authentication form
    return (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                    ⚡ Create Alchemy Smart Account
                </h3>
                <p className="text-slate-400 text-sm">
                    Sign in with your email to create a gasless smart account powered by Alchemy Account Kit
                </p>
            </div>

            {/* Configuration Status */}
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                    <div className="text-blue-400">⚙️</div>
                    <h4 className="font-medium text-blue-300">Backend Configuration</h4>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                    <div>Chain: Base Sepolia (84532)</div>
                    <div>Backend API: ✅ Connected</div>
                    <div>Gas Manager: ✅ Enabled via Backend</div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <div className="text-red-300 text-sm">❌ {error}</div>
                </div>
            )}

            {/* Email Authentication Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={!email || loading}
                    className="w-full"
                    variant="primary"
                >
                    {loading ? (
                        <>🔄 Creating Smart Account...</>
                    ) : (
                        <>⚡ Create Smart Account</>
                    )}
                </Button>
            </form>

            {/* Features */}
            <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                    <div className="text-green-400">✨</div>
                    <h4 className="font-medium text-green-300">Features</h4>
                </div>
                <div className="text-sm text-green-200 space-y-1">
                    <div>• Gasless transactions with Alchemy Gas Manager</div>
                    <div>• Email-based authentication (no seed phrases)</div>
                    <div>• Account recovery built-in</div>
                    <div>• Battle-tested by Alchemy infrastructure</div>
                </div>
            </div>

        </Card>
    );
};
