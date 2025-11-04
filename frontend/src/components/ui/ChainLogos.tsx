import React from 'react';

interface ChainLogoProps {
    size?: number;
    className?: string;
}

// Ethereum Logo
export const EthereumLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M12 0L5.5 12.25L12 16.5L18.5 12.25L12 0Z"
            fill="#627EEA"
        />
        <path
            d="M12 24L5.5 13.75L12 18L18.5 13.75L12 24Z"
            fill="#627EEA"
            fillOpacity="0.8"
        />
    </svg>
);

// Polygon Logo
export const PolygonLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M12 0L2 6v12l10 6 10-6V6L12 0z"
            fill="#8247E5"
        />
        <path
            d="M7 9l5-3 5 3v6l-5 3-5-3V9z"
            fill="#FFFFFF"
        />
    </svg>
);

// Base Logo
export const BaseLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle
            cx="12"
            cy="12"
            r="12"
            fill="#0052FF"
        />
        <path
            d="M12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8c-1.168 0-2.277-.25-3.281-.7L12 12V4z"
            fill="#FFFFFF"
        />
    </svg>
);

// Arbitrum Logo
export const ArbitrumLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <path
            d="M12 0L2.5 20h19L12 0z"
            fill="#213147"
        />
        <path
            d="M12 4L6 16h12L12 4z"
            fill="#12AAFF"
        />
        <path
            d="M12 8L9 14h6L12 8z"
            fill="#9DCCED"
        />
    </svg>
);

// Optimism Logo
export const OptimismLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle
            cx="12"
            cy="12"
            r="12"
            fill="#FF0420"
        />
        <path
            d="M7.5 9c-1.5 0-2.5 1-2.5 2.5S6 14 7.5 14h2c1.5 0 2.5-1 2.5-2.5S11 9 9.5 9h-2zm9 0c-1.5 0-2.5 1-2.5 2.5S15 14 16.5 14 19 13 19 11.5 18 9 16.5 9z"
            fill="#FFFFFF"
        />
    </svg>
);

// Testnet Icon (for testnets)
export const TestnetLogo: React.FC<ChainLogoProps> = ({size = 24, className = ''}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle
            cx="12"
            cy="12"
            r="10"
            fill="#6B7280"
            stroke="#9CA3AF"
            strokeWidth="2"
        />
        <path
            d="M8 12l2 2 4-4"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle
            cx="18"
            cy="6"
            r="3"
            fill="#EAB308"
        />
        <text
            x="18"
            y="7"
            fontSize="8"
            fill="#FFFFFF"
            textAnchor="middle"
            dominantBaseline="middle"
        >
            T
        </text>
    </svg>
);

// Generic Chain Logo (fallback)
export const GenericChainLogo: React.FC<ChainLogoProps & { color?: string; symbol?: string }> = ({
                                                                                                     size = 24,
                                                                                                     className = '',
                                                                                                     color = '#6B7280',
                                                                                                     symbol = '?'
                                                                                                 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <circle
            cx="12"
            cy="12"
            r="12"
            fill={color}
        />
        <text
            x="12"
            y="12"
            fontSize="10"
            fill="#FFFFFF"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
        >
            {symbol.slice(0, 2)}
        </text>
    </svg>
);

// Chain Logo Mapper
interface ChainLogoMapperProps extends ChainLogoProps {
    chainId: number;
    symbol?: string;
}

export const ChainLogoMapper: React.FC<ChainLogoMapperProps> = ({
                                                                    chainId,
                                                                    symbol = 'ETH',
                                                                    size = 24,
                                                                    className = ''
                                                                }) => {
    const getChainColor = (chainId: number): string => {
        const colors: Record<number, string> = {
            1: '#627EEA',      // Ethereum
            137: '#8247E5',    // Polygon
            8453: '#0052FF',   // Base
            84532: '#0052FF',  // Base Sepolia
            42161: '#213147',  // Arbitrum
            421614: '#213147', // Arbitrum Sepolia
            10: '#FF0420',     // Optimism
            11155420: '#FF0420', // Optimism Sepolia
            11155111: '#627EEA', // Ethereum Sepolia
            80001: '#8247E5',  // Polygon Mumbai
        };
        return colors[chainId] || '#6B7280';
    };

    const chainColor = getChainColor(chainId);

    // Mainnet chains
    switch (chainId) {
        case 1: // Ethereum Mainnet
            return <EthereumLogo size={size} className={className}/>;
        case 137: // Polygon Mainnet
            return <PolygonLogo size={size} className={className}/>;
        case 8453: // Base Mainnet
            return <BaseLogo size={size} className={className}/>;
        case 42161: // Arbitrum One
            return <ArbitrumLogo size={size} className={className}/>;
        case 10: // Optimism Mainnet
            return <OptimismLogo size={size} className={className}/>;

        // Testnet chains - use main chain logo with testnet indicator
        case 11155111: // Ethereum Sepolia
        case 80001: // Polygon Mumbai
        case 84532: // Base Sepolia
        case 421614: // Arbitrum Sepolia
        case 11155420: // Optimism Sepolia
            return (
                <div className="relative inline-block">
                    {chainId === 11155111 && <EthereumLogo size={size} className={className}/>}
                    {chainId === 80001 && <PolygonLogo size={size} className={className}/>}
                    {chainId === 84532 && <BaseLogo size={size} className={className}/>}
                    {chainId === 421614 && <ArbitrumLogo size={size} className={className}/>}
                    {chainId === 11155420 && <OptimismLogo size={size} className={className}/>}
                    <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold leading-none">T</span>
                        </div>
                    </div>
                </div>
            );

        default:
            return (
                <GenericChainLogo
                    size={size}
                    className={className}
                    color={chainColor}
                    symbol={symbol}
                />
            );
    }
};