import React, {useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, CheckCircle, ExternalLink, Mail, Shield, Sparkles, Zap} from 'lucide-react';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {Card, CardContent, CardHeader, CardTitle} from '../ui/Card';
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
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    const handleConnect = async () => {
        if (!email.trim()) {
            return;
        }

        setIsConnecting(true);
        try {
            await connect(email.trim());
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 3000);
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

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Loading State
    if (loading) {
        return (
            <Card variant="cyber" className="max-w-lg mx-auto">
                <CardContent className="p-8">
                    <motion.div
                        className="flex flex-col items-center space-y-4"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                    >
                        <div className="relative">
                            <Spinner variant="neon" size="lg"/>
                            <motion.div
                                className="absolute inset-0 bg-web3-primary/20 rounded-full"
                                animate={{scale: [1, 1.2, 1]}}
                                transition={{duration: 2, repeat: Infinity}}
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-jakarta font-bold text-foreground mb-2">
                                Initializing Nexus Wallet
                            </h3>
                            <p className="text-muted-foreground font-jakarta">
                                Connecting to the blockchain...
                            </p>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        );
    }

    // Connected State
    if (isAuthenticated && user) {
        return (
            <motion.div
                initial={{scale: 0.95, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                className="max-w-lg mx-auto"
            >
                <Card variant="neon" className="relative overflow-hidden">
                    <AnimatePresence>
                        {showSuccessAnimation && (
                            <motion.div
                                initial={{scale: 0, opacity: 0}}
                                animate={{scale: 1, opacity: 1}}
                                exit={{scale: 1.2, opacity: 0}}
                                className="absolute inset-0 bg-web3-accent/10 backdrop-blur-sm z-10 flex items-center justify-center"
                            >
                                <motion.div
                                    animate={{rotate: [0, 360]}}
                                    transition={{duration: 1}}
                                    className="text-web3-accent"
                                >
                                    <Sparkles size={48}/>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <CardHeader className="text-center">
                        <motion.div
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{type: "spring", stiffness: 200}}
                            className="w-20 h-20 bg-gradient-to-br from-web3-accent to-web3-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-green"
                        >
                            <CheckCircle size={40} className="text-white"/>
                        </motion.div>
                        <CardTitle className="text-2xl font-jakarta web3-gradient-text">
                            Wallet Connected!
                        </CardTitle>
                        <p className="text-muted-foreground font-jakarta">{user.email}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {smartAccountAddress ? (
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                className="bg-cyber-glass rounded-web3 p-6 border border-web3-accent/30"
                            >
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-3 h-3 bg-web3-accent rounded-full animate-pulse-neon"/>
                                    <h4 className="font-jakarta font-bold text-web3-accent">Smart Account Active</h4>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 font-jakarta">Account
                                            Address:</p>
                                        <div
                                            className="bg-card/50 rounded-cyber p-3 font-mono text-sm break-all border border-border/30">
                                            {smartAccountAddress}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {[
                                            {icon: Zap, text: 'Gasless Transactions', color: 'text-web3-accent'},
                                            {icon: Shield, text: 'Account Recovery', color: 'text-web3-secondary'},
                                            {icon: Sparkles, text: 'Session Keys', color: 'text-web3-primary'}
                                        ].map((feature, index) => (
                                            <motion.div
                                                key={feature.text}
                                                initial={{opacity: 0, x: -20}}
                                                animate={{opacity: 1, x: 0}}
                                                transition={{delay: index * 0.1}}
                                                className="flex items-center space-x-2 text-xs"
                                            >
                                                <feature.icon size={14} className={feature.color}/>
                                                <span
                                                    className="text-muted-foreground font-jakarta">{feature.text}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                className="bg-card/30 rounded-web3 p-6 border border-web3-primary/30"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <Spinner variant="neon" size="sm"/>
                                    <h4 className="font-jakarta font-bold text-web3-primary">Setting up Smart
                                        Account</h4>
                                </div>
                                <p className="text-sm text-muted-foreground font-jakarta">
                                    Preparing your smart contract wallet with advanced features...
                                </p>
                            </motion.div>
                        )}

                        {smartAccountAddress && (
                            <motion.div
                                initial={{opacity: 0, y: 10}}
                                animate={{opacity: 1, y: 0}}
                                className="text-center py-3"
                            >
                                <p className="text-sm text-web3-accent font-medium">
                                    ✓ Setup complete! Redirecting to dashboard...
                                </p>
                            </motion.div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleDisconnect}
                                variant="outline"
                                className="flex-1"
                                disabled={loading}
                            >
                                Disconnect
                            </Button>
                            {smartAccountAddress && (
                                <Button
                                    onClick={() => window.open(`https://sepolia.basescan.org/address/${smartAccountAddress}`, '_blank')}
                                    variant="secondary"
                                    glow
                                >
                                    <ExternalLink size={16}/>
                                    Explorer
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Connection Form State
    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="max-w-lg mx-auto"
        >
            <Card variant="glass" className="relative overflow-hidden">
                {/* Animated background gradient */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-web3-primary/5 via-transparent to-web3-secondary/5 animate-pulse"/>

                <CardHeader className="text-center relative">
                    <motion.div
                        initial={{scale: 0}}
                        animate={{scale: 1}}
                        transition={{type: "spring", stiffness: 150}}
                        className="w-16 h-16 bg-gradient-to-br from-web3-primary to-web3-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-cyber"
                    >
                        <Mail size={32} className="text-white"/>
                    </motion.div>
                    <CardTitle className="text-3xl font-jakarta font-bold mb-2">
                        <span className="web3-gradient-text">Connect Your</span>
                        <br/>
                        <span className="text-foreground">Smart Wallet</span>
                    </CardTitle>
                    <p className="text-muted-foreground font-jakarta max-w-md mx-auto">
                        Enter your email to create or access your ERC-4337 smart contract wallet with advanced Web3
                        features
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 relative">
                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{opacity: 0, y: -20, scale: 0.95}}
                                animate={{opacity: 1, y: 0, scale: 1}}
                                exit={{opacity: 0, y: -20, scale: 0.95}}
                                className="bg-web3-danger/10 border border-web3-danger/30 rounded-web3 p-4"
                            >
                                <div className="flex items-start space-x-3">
                                    <AlertCircle size={20} className="text-web3-danger mt-0.5 flex-shrink-0"/>
                                    <div>
                                        <h4 className="font-jakarta font-semibold text-web3-danger text-sm mb-1">
                                            Connection Failed
                                        </h4>
                                        <p className="text-sm text-muted-foreground font-jakarta">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Email Input */}
                    <motion.div
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.1}}
                    >
                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="vitalik@ethereum.org"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && isValidEmail(email.trim())) {
                                    handleConnect();
                                }
                            }}
                            disabled={isConnecting}
                            error={email && !isValidEmail(email) ? 'Please enter a valid email address' : undefined}
                            leftIcon={<Mail size={18}/>}
                            variant="cyber"
                            required
                        />
                    </motion.div>

                    {/* Connect Button */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.2}}
                    >
                        <Button
                            onClick={handleConnect}
                            disabled={!email.trim() || !isValidEmail(email.trim()) || isConnecting}
                            loading={isConnecting}
                            variant="primary"
                            size="lg"
                            className="w-full"
                            glow
                        >
                            {isConnecting ? (
                                <>
                                    <Spinner variant="neon" size="sm"/>
                                    Creating Smart Account...
                                </>
                            ) : (
                                <>
                                    <Zap size={18}/>
                                    Connect Wallet
                                </>
                            )}
                        </Button>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.3}}
                        className="bg-cyber-glass rounded-web3 p-6 border border-web3-primary/20"
                    >
                        <h4 className="font-jakarta font-bold text-web3-primary mb-4 flex items-center space-x-2">
                            <Sparkles size={16}/>
                            <span>What you'll get:</span>
                        </h4>
                        <div className="grid gap-3">
                            {[
                                {icon: Zap, text: 'Gasless transactions', desc: 'No need to hold ETH for gas fees'},
                                {
                                    icon: Shield,
                                    text: 'Social recovery',
                                    desc: 'Recover your wallet with trusted contacts'
                                },
                                {icon: CheckCircle, text: 'Session keys', desc: 'Seamless dApp interactions'}
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature.text}
                                    initial={{opacity: 0, x: -20}}
                                    animate={{opacity: 1, x: 0}}
                                    transition={{delay: 0.4 + index * 0.1}}
                                    className="flex items-start space-x-3"
                                >
                                    <div className="mt-1">
                                        <feature.icon size={16} className="text-web3-accent"/>
                                    </div>
                                    <div>
                                        <p className="font-jakarta font-semibold text-foreground text-sm">
                                            {feature.text}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-jakarta">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Powered By */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.5}}
                        className="text-center"
                    >
                        <p className="text-xs text-muted-foreground font-jakarta">
                            Powered by <span className="text-web3-primary font-semibold">Alchemy Account Kit</span> &
                            <span className="text-web3-secondary font-semibold"> ERC-4337</span>
                        </p>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
