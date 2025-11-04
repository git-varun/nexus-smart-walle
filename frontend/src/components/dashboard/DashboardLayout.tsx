import React from 'react';
import {motion} from 'framer-motion';
import {Button} from '../ui/Button';
import {ChainSelector} from '../ui/ChainSelector';
import {ProfileAvatar} from '../ui/ProfileAvatar';
import {useBackendSmartAccount} from '@/hooks/useBackendSmartAccount.ts';

type DashboardSection = 'overview' | 'accounts' | 'transactions' | 'sessions' | 'profile';

interface DashboardLayoutProps {
    children: React.ReactNode;
    currentSection: DashboardSection;
    onSectionChange: (section: DashboardSection) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
                                                                    children,
                                                                    currentSection,
                                                                    onSectionChange
                                                                }) => {
    const {user, disconnect, accountInfo, currentChainId, switchChain} = useBackendSmartAccount();

    const navigationItems = [
        {
            id: 'overview' as DashboardSection,
            label: 'Overview',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                </svg>
            )
        },
        {
            id: 'accounts' as DashboardSection,
            label: 'Accounts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
            )
        },
        {
            id: 'transactions' as DashboardSection,
            label: 'Transactions',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
            )
        },
        {
            id: 'sessions' as DashboardSection,
            label: 'Session Keys',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1221 9z"/>
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
            {/* Sidebar */}
            <div className="w-64 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 bg-gradient-to-r from-web3-primary to-web3-secondary rounded-xl flex items-center justify-center shadow-neon">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Nexus</h1>
                            <p className="text-xs text-muted-foreground">Smart Wallet</p>
                        </div>
                    </div>

                    {/* Enhanced Profile Button */}
                    <motion.div
                        className="bg-gradient-to-r from-card/80 to-card/60 rounded-xl p-4 cursor-pointer hover:from-card/90 hover:to-card/80 transition-all duration-300 border border-border hover:border-web3-primary/40 shadow-lg hover:shadow-xl backdrop-blur-sm"
                        whileHover={{scale: 1.02, y: -2}}
                        whileTap={{scale: 0.98}}
                        onClick={() => onSectionChange('profile')}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1}}
                    >
                        <div className="flex items-center gap-3">
                            <ProfileAvatar
                                userId={user?.id}
                                email={user?.email}
                                size="lg"
                                animated={false}
                                showOnlineStatus={true}
                                isOnline={true}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {user?.email?.split('@')[0] || 'User'}
                                    </p>
                                    <div className={`w-2 h-2 rounded-full ${
                                        accountInfo?.isDeployed ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'
                                    } shadow-lg animate-pulse`}/>
                                </div>
                                <p className="text-xs text-muted-foreground/80 truncate">
                                    {user?.email || 'Click to manage profile'}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        accountInfo?.isDeployed
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    }`}>
                                        {accountInfo?.isDeployed ? 'Active' : 'Setup'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <motion.div
                                    className="w-5 h-5 text-muted-foreground hover:text-web3-primary transition-colors"
                                    whileHover={{rotate: 90}}
                                    transition={{duration: 0.2}}
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                </motion.div>
                                <div className="text-xs text-muted-foreground/60">Profile</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <div className="space-y-2">
                        {navigationItems.map((item) => (
                            <motion.button
                                key={item.id}
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                onClick={() => onSectionChange(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                    currentSection === item.id
                                        ? 'bg-web3-primary/20 text-web3-primary border border-web3-primary/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </nav>

                {/* Account Status */}
                <div className="p-4 border-t border-border">
                    {accountInfo && (
                        <div className="mb-4 p-3 bg-card/70 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Smart Account</span>
                                <div className={`w-2 h-2 rounded-full ${
                                    accountInfo.isDeployed ? 'bg-green-500' : 'bg-yellow-500'
                                }`}/>
                            </div>
                            <p className="text-xs font-mono text-foreground truncate">
                                {accountInfo.address ?
                                    `${accountInfo.address.slice(0, 6)}...${accountInfo.address.slice(-4)}`
                                    : 'Not deployed'
                                }
                            </p>
                            {accountInfo.balance && (
                                <p className="text-xs text-muted-foreground">
                                    Balance: {accountInfo.balance} ETH
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={disconnect}
                        className="w-full justify-start text-muted-foreground hover:text-red-400"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header with Chain Selector */}
                <div className="bg-card/30 backdrop-blur-sm border-b border-border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-foreground capitalize">
                                {currentSection === 'overview' ? 'Dashboard Overview' :
                                    currentSection === 'accounts' ? 'Smart Accounts' :
                                        currentSection === 'transactions' ? 'Transaction Center' :
                                            currentSection === 'sessions' ? 'Session Keys' :
                                                'User Profile'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <ChainSelector
                                selectedChainId={currentChainId}
                                onChainSelect={switchChain}
                                label=""
                                showTestnets={true}
                                popularOnly={true}
                                size="sm"
                                className="min-w-[200px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};