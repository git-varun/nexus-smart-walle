import React, {useMemo} from 'react';
import {motion} from 'framer-motion';

interface ProfileAvatarProps {
    userId?: string;
    username?: string;
    email?: string;
    profileImageUrl?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showOnlineStatus?: boolean;
    isOnline?: boolean;
    onClick?: () => void;
    animated?: boolean;
}

interface AvatarConfig {
    backgroundColor: string;
    textColor: string;
    gradientStart: string;
    gradientEnd: string;
    pattern: string;
}

// Simple hash function for deterministic avatar generation
const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
};

// Generate consistent color palette from userId
const generateAvatarConfig = (userId: string): AvatarConfig => {
    const hash = hashString(userId);

    // Color palettes for avatar generation
    const colorPalettes = [
        {
            backgroundColor: '#8b5cf6',
            textColor: '#ffffff',
            gradientStart: '#8b5cf6',
            gradientEnd: '#a78bfa'
        },
        {
            backgroundColor: '#06b6d4',
            textColor: '#ffffff',
            gradientStart: '#06b6d4',
            gradientEnd: '#67e8f9'
        },
        {
            backgroundColor: '#10b981',
            textColor: '#ffffff',
            gradientStart: '#10b981',
            gradientEnd: '#6ee7b7'
        },
        {
            backgroundColor: '#f59e0b',
            textColor: '#ffffff',
            gradientStart: '#f59e0b',
            gradientEnd: '#fbbf24'
        },
        {
            backgroundColor: '#ef4444',
            textColor: '#ffffff',
            gradientStart: '#ef4444',
            gradientEnd: '#f87171'
        },
        {
            backgroundColor: '#8b5cf6',
            textColor: '#ffffff',
            gradientStart: '#8b5cf6',
            gradientEnd: '#ec4899'
        },
        {
            backgroundColor: '#6366f1',
            textColor: '#ffffff',
            gradientStart: '#6366f1',
            gradientEnd: '#8b5cf6'
        },
        {
            backgroundColor: '#14b8a6',
            textColor: '#ffffff',
            gradientStart: '#14b8a6',
            gradientEnd: '#06b6d4'
        }
    ];

    const patterns = ['dots', 'waves', 'geometric', 'gradient'];

    const paletteIndex = hash % colorPalettes.length;
    const patternIndex = Math.floor(hash / colorPalettes.length) % patterns.length;

    return {
        ...colorPalettes[paletteIndex],
        pattern: patterns[patternIndex]
    };
};

// Generate initials from username or email
const getInitials = (username?: string, email?: string): string => {
    if (username) {
        return username.length >= 2
            ? username.slice(0, 2).toUpperCase()
            : username.charAt(0).toUpperCase();
    }

    if (email) {
        const emailPart = email.split('@')[0];
        return emailPart.length >= 2
            ? emailPart.slice(0, 2).toUpperCase()
            : emailPart.charAt(0).toUpperCase();
    }

    return 'U';
};

// Generate SVG pattern based on avatar config
const generatePattern = (config: AvatarConfig, size: number): string => {
    const patternSize = size / 4;

    switch (config.pattern) {
        case 'dots':
            return `
                <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${patternSize * 0.3}" fill="${config.gradientEnd}" opacity="0.3"/>
                <circle cx="${size * 0.7}" cy="${size * 0.7}" r="${patternSize * 0.2}" fill="${config.gradientEnd}" opacity="0.4"/>
                <circle cx="${size * 0.2}" cy="${size * 0.8}" r="${patternSize * 0.15}" fill="${config.gradientEnd}" opacity="0.3"/>
            `;
        case 'waves':
            return `
                <path d="M0,${size * 0.6} Q${size * 0.25},${size * 0.4} ${size * 0.5},${size * 0.6} T${size},${size * 0.6}"
                      stroke="${config.gradientEnd}" stroke-width="2" fill="none" opacity="0.4"/>
                <path d="M0,${size * 0.3} Q${size * 0.25},${size * 0.1} ${size * 0.5},${size * 0.3} T${size},${size * 0.3}"
                      stroke="${config.gradientEnd}" stroke-width="1" fill="none" opacity="0.3"/>
            `;
        case 'geometric':
            return `
                <polygon points="${size * 0.2},${size * 0.2} ${size * 0.4},${size * 0.1} ${size * 0.4},${size * 0.3}"
                         fill="${config.gradientEnd}" opacity="0.3"/>
                <polygon points="${size * 0.6},${size * 0.7} ${size * 0.8},${size * 0.6} ${size * 0.8},${size * 0.8}"
                         fill="${config.gradientEnd}" opacity="0.4"/>
            `;
        default:
            return '';
    }
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
                                                                userId = 'default',
                                                                username,
                                                                email,
                                                                profileImageUrl,
                                                                size = 'md',
                                                                className = '',
                                                                showOnlineStatus = false,
                                                                isOnline = false,
                                                                onClick,
                                                                animated = true
                                                            }) => {
    // Size configurations
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-lg',
        xl: 'w-24 h-24 text-xl'
    };

    const sizePixels = {
        sm: 32,
        md: 40,
        lg: 64,
        xl: 96
    };

    // Generate avatar configuration
    const avatarConfig = useMemo(() => generateAvatarConfig(userId), [userId]);
    const initials = useMemo(() => getInitials(username, email), [username, email]);
    const pattern = useMemo(() => generatePattern(avatarConfig, sizePixels[size]), [avatarConfig, size]);

    // Create SVG avatar if no profile image
    const svgAvatar = useMemo(() => {
        if (profileImageUrl) return null;

        const svgSize = sizePixels[size];
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${avatarConfig.gradientStart};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${avatarConfig.gradientEnd};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" rx="${svgSize * 0.5}" fill="url(#gradient)"/>
                ${pattern}
                <text x="50%" y="50%" text-anchor="middle" dy="0.35em"
                      fill="${avatarConfig.textColor}"
                      font-family="system-ui, -apple-system, sans-serif"
                      font-size="${svgSize * 0.4}"
                      font-weight="600">
                    ${initials}
                </text>
            </svg>
        `)}`;
    }, [profileImageUrl, size, avatarConfig, initials, pattern]);

    const AvatarComponent = animated ? motion.div : 'div';
    const animationProps = animated ? {
        whileHover: {scale: 1.05},
        whileTap: {scale: 0.95},
        transition: {type: "spring", stiffness: 300, damping: 20}
    } : {};

    return (
        <AvatarComponent
            {...animationProps}
            className={`
                relative inline-flex items-center justify-center rounded-full
                ${sizeClasses[size]}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
                overflow-hidden
                shadow-md hover:shadow-lg transition-shadow duration-200
            `}
            onClick={onClick}
            style={{
                backgroundColor: profileImageUrl ? 'transparent' : avatarConfig.backgroundColor
            }}
        >
            {profileImageUrl ? (
                <img
                    src={profileImageUrl}
                    alt={username || email || 'Profile'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <img
                    src={svgAvatar!}
                    alt={username || email || 'Profile'}
                    className="w-full h-full object-cover"
                />
            )}

            {showOnlineStatus && (
                <div className={`
                    absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                    ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
                `}/>
            )}
        </AvatarComponent>
    );
};

// Hook for generating avatar data
export const useProfileAvatar = (userId?: string, username?: string, email?: string) => {
    return useMemo(() => {
        if (!userId && !email) return null;

        const id = userId || email || 'default';
        const config = generateAvatarConfig(id);
        const initials = getInitials(username, email);

        return {
            config,
            initials,
            userId: id
        };
    }, [userId, username, email]);
};