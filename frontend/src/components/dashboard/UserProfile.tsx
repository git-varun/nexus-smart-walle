import React, {useCallback, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card} from '../ui/Card';
import {Button} from '../ui/Button';
import {Input} from '../ui/Input';
import {ProfileAvatar} from '../ui/ProfileAvatar';
import {useBackendSmartAccount} from '../../hooks/useBackendSmartAccount';
import {DEFAULT_USER_PREFERENCES, SUPPORTED_LANGUAGES, UserPreferences, validateUsername} from '../../types/user';

interface ProfileSection {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface ProfileFormData {
    username: string;
    displayName: string;
    email: string;
}

export const UserProfile: React.FC = () => {
    const {user, accountInfo} = useBackendSmartAccount();
    const [activeSection, setActiveSection] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState<ProfileFormData>({
        username: user?.username || '',
        displayName: user?.displayName || user?.email?.split('@')[0] || '',
        email: user?.email || ''
    });
    const [preferences, setPreferences] = useState<UserPreferences>(
        user?.preferences || DEFAULT_USER_PREFERENCES
    );

    const profileSections: ProfileSection[] = [
        {
            id: 'personal',
            title: 'Personal Information',
            description: 'Manage your profile details and avatar',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
            )
        },
        {
            id: 'preferences',
            title: 'Preferences',
            description: 'Customize your app experience',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            )
        },
        {
            id: 'privacy',
            title: 'Privacy & Security',
            description: 'Control your privacy settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
            )
        },
        {
            id: 'account',
            title: 'Account Status',
            description: 'View your smart account details',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
            )
        }
    ];

    const checkUsernameAvailability = useCallback(async (username: string) => {
        if (!username || username === user?.username) {
            setUsernameAvailable(null);
            return;
        }

        const validation = validateUsername(username);
        if (!validation.valid) {
            setUsernameAvailable(false);
            return;
        }

        setUsernameCheckLoading(true);
        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setUsernameAvailable(Math.random() > 0.5); // Mock availability
        } catch (error) {
            console.error('Failed to check username availability:', error);
        } finally {
            setUsernameCheckLoading(false);
        }
    }, [user?.username]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Implement actual API call to update profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Saving profile:', {formData, preferences});
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderPersonalInfo = () => (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">Manage your profile details and avatar</p>
                </div>
                <Button
                    variant={isEditing ? "outline" : "primary"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                    <ProfileAvatar
                        userId={user?.id}
                        username={formData.username}
                        email={user?.email}
                        profileImageUrl={user?.profileImageUrl}
                        size="xl"
                        animated={true}
                    />
                    {isEditing && (
                        <div className="text-center">
                            <Button variant="outline" size="sm" className="mb-2">
                                Change Avatar
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Upload a custom image or use generated avatar
                            </p>
                        </div>
                    )}
                </div>

                {/* Profile Details */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Username"
                            value={formData.username}
                            onChange={(e) => {
                                setFormData(prev => ({...prev, username: e.target.value}));
                                checkUsernameAvailability(e.target.value);
                            }}
                            disabled={!isEditing}
                            variant="cyber"
                            placeholder="Choose a unique username"
                            helperText={
                                usernameCheckLoading ? "Checking availability..." :
                                    usernameAvailable === true ? "Username is available" :
                                        usernameAvailable === false ? "Username is not available" :
                                            undefined
                            }
                            leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                            }
                        />

                        <Input
                            label="Display Name"
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({...prev, displayName: e.target.value}))}
                            disabled={!isEditing}
                            variant="cyber"
                            placeholder="How you'd like to be addressed"
                            leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                            }
                        />
                    </div>

                    <Input
                        label="Email Address"
                        value={formData.email}
                        disabled={true}
                        variant="cyber"
                        helperText="Email cannot be changed. Contact support if needed."
                        leftIcon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        }
                    />

                    <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Member since:</span>
                            <span className="text-foreground">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-muted-foreground">Last login:</span>
                            <span className="text-foreground">
                                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end pt-4 space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                                glow
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    const renderPreferences = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">App Preferences</h3>

                <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-3">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['light', 'dark', 'auto'] as const).map((theme) => (
                                <motion.div
                                    key={theme}
                                    whileHover={{scale: 1.02}}
                                    whileTap={{scale: 0.98}}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        preferences.theme === theme
                                            ? 'border-web3-primary bg-web3-primary/10'
                                            : 'border-border hover:border-web3-primary/50'
                                    }`}
                                    onClick={() => setPreferences(prev => ({...prev, theme}))}
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-medium text-foreground capitalize">{theme}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {theme === 'auto' ? 'System default' : `${theme} mode`}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="text-sm font-medium text-foreground block mb-3">Language</label>
                        <select
                            value={preferences.language}
                            onChange={(e) => setPreferences(prev => ({...prev, language: e.target.value}))}
                            className="w-full p-3 bg-card border border-border rounded-lg text-foreground focus:border-web3-primary focus:outline-none"
                        >
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-foreground">Notifications</div>
                            <div className="text-xs text-muted-foreground">Receive app notifications</div>
                        </div>
                        <motion.button
                            whileTap={{scale: 0.95}}
                            onClick={() => setPreferences(prev => ({...prev, notifications: !prev.notifications}))}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                preferences.notifications ? 'bg-web3-primary' : 'bg-muted'
                            }`}
                        >
                            <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{x: preferences.notifications ? 28 : 2}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            />
                        </motion.button>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Privacy Settings</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-foreground">Show Email</div>
                            <div className="text-xs text-muted-foreground">Display your email in public profile</div>
                        </div>
                        <motion.button
                            whileTap={{scale: 0.95}}
                            onClick={() => setPreferences(prev => ({
                                ...prev,
                                privacy: {...prev.privacy, showEmail: !prev.privacy.showEmail}
                            }))}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                preferences.privacy.showEmail ? 'bg-web3-primary' : 'bg-muted'
                            }`}
                        >
                            <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{x: preferences.privacy.showEmail ? 28 : 2}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            />
                        </motion.button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-foreground">Online Status</div>
                            <div className="text-xs text-muted-foreground">Show when you're online</div>
                        </div>
                        <motion.button
                            whileTap={{scale: 0.95}}
                            onClick={() => setPreferences(prev => ({
                                ...prev,
                                privacy: {...prev.privacy, showOnlineStatus: !prev.privacy.showOnlineStatus}
                            }))}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                preferences.privacy.showOnlineStatus ? 'bg-web3-primary' : 'bg-muted'
                            }`}
                        >
                            <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{x: preferences.privacy.showOnlineStatus ? 28 : 2}}
                                transition={{type: "spring", stiffness: 300, damping: 20}}
                            />
                        </motion.button>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderAccountStatus = () => (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Smart Account Status</h3>

            <div className="space-y-4">
                <div className="p-4 bg-card/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Account Status</span>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            accountInfo?.isDeployed
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                            {accountInfo?.isDeployed ? 'Active & Deployed' : 'Setup Required'}
                        </div>
                    </div>

                    {accountInfo?.address && (
                        <div className="text-xs text-muted-foreground font-mono">
                            {accountInfo.address}
                        </div>
                    )}
                </div>

                {accountInfo?.balance && (
                    <div className="p-4 bg-card/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Balance</span>
                            <span className="text-sm font-mono text-foreground">
                                {accountInfo.balance} ETH
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'personal':
                return renderPersonalInfo();
            case 'preferences':
                return renderPreferences();
            case 'privacy':
                return renderPreferences();
            case 'account':
                return renderAccountStatus();
            default:
                return renderPersonalInfo();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {profileSections.map((section) => (
                    <motion.div
                        key={section.id}
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        onClick={() => setActiveSection(section.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            activeSection === section.id
                                ? 'border-web3-primary bg-web3-primary/10 shadow-lg'
                                : 'border-border hover:border-web3-primary/50 bg-card/50'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${
                                activeSection === section.id
                                    ? 'bg-web3-primary/20 text-web3-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {section.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">{section.title}</h3>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                    </motion.div>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -20}}
                    transition={{duration: 0.2}}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};