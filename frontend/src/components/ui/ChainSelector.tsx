import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {Button} from './Button';

interface ChainOption {
    chainId: number;
    name: string;
    shortName: string;
    icon?: string;
}

interface ChainSelectorProps {
    onChainChange?: (chainId: number) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const chainOptions: ChainOption[] = [
    {
        chainId: 84532,
        name: 'Base Sepolia',
        shortName: 'Base Sepolia',
        icon: '🔵'
    },
    {
        chainId: 8453,
        name: 'Base Mainnet',
        shortName: 'Base',
        icon: '🔵'
    }
];

export const ChainSelector: React.FC<ChainSelectorProps> = ({
                                                                onChainChange,
                                                                disabled = false,
                                                                size = 'sm'
                                                            }) => {
    // Currently fixed to Base Sepolia since backend handles chain configuration
    const currentChain = chainOptions.find(chain => chain.chainId === 84532);

    const handleChainSwitch = async (chainId: number) => {
        console.log('Chain switching not implemented with backend architecture:', chainId);
        onChainChange?.(chainId);
    };

    // Show in development mode
    if (import.meta.env.MODE === 'production') {
        return null;
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <Button
                    variant="outline"
                    size={size}
                    disabled={disabled}
                    className="flex items-center space-x-2 min-w-[120px]"
                >
                    <span>{currentChain?.icon || '🔗'}</span>
                    <span className="hidden sm:inline">{currentChain?.shortName || 'Unknown'}</span>
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="ml-1"
                    >
                        <path
                            d="M3 4.5L6 7.5L9 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg z-50"
                    sideOffset={4}
                >
                    {chainOptions.map((chain) => {
                        const isSelected = chain.chainId === 84532;

                        return (
                            <DropdownMenu.Item
                                key={chain.chainId}
                                className={`
                  flex items-center space-x-3 px-3 py-2 text-sm rounded-md cursor-pointer
                  ${isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                }
                  focus:outline-none focus:ring-1 focus:ring-blue-500
                `}
                                onSelect={() => !isSelected && handleChainSwitch(chain.chainId)}
                                disabled={isSelected}
                            >
                                <span className="text-base">{chain.icon}</span>
                                <div className="flex-1">
                                    <div className="font-medium">{chain.name}</div>
                                    <div className="text-xs opacity-75">Chain ID: {chain.chainId}</div>
                                </div>
                                {isSelected && (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        className="text-white"
                                    >
                                        <path
                                            d="M13.5 4.5L6 12L2.5 8.5"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </DropdownMenu.Item>
                        );
                    })}

                    <DropdownMenu.Separator className="h-px bg-slate-700 my-1"/>

                    <div className="px-3 py-2 text-xs text-slate-500">
                        Development Mode Only
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
