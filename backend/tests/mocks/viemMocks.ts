/**
 * Mock implementations for Viem client functions
 */

export const mockPublicClient = {
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
    getBlockNumber: jest.fn().mockResolvedValue(BigInt(12345)),
    getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        gasUsed: BigInt(21000),
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    }),
    waitForTransactionReceipt: jest.fn().mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        gasUsed: BigInt(21000)
    })
};

export const mockWalletClient = {
    signMessage: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c'),
    signTypedData: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c'),
    sendTransaction: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
};

// Mock the viem module
jest.mock('viem', () => ({
    createPublicClient: jest.fn().mockReturnValue(mockPublicClient),
    createWalletClient: jest.fn().mockReturnValue(mockWalletClient),
    http: jest.fn(),
    parseEther: jest.fn((value: string) => BigInt(value) * BigInt('1000000000000000000')),
    formatEther: jest.fn((value: bigint) => (Number(value) / 1000000000000000000).toString()),
    getAddress: jest.fn((address: string) => address.toLowerCase()),
    isAddress: jest.fn((address: string) => address.startsWith('0x') && address.length === 42)
}));

jest.mock('viem/chains', () => ({
    baseSepolia: {
        id: 84532,
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH'
        },
        rpcUrls: {
            default: {
                http: ['https://sepolia.base.org']
            }
        },
        blockExplorers: {
            default: {
                name: 'BaseScan',
                url: 'https://sepolia.basescan.org'
            }
        }
    }
}));
