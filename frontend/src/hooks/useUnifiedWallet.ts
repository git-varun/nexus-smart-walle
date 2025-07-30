import {useAccount, useDisconnect} from 'wagmi';
import {useBackendSmartAccount} from './useBackendSmartAccount';

/**
 * Unified hook that works with both MetaMask and email-based wallets
 */
export function useUnifiedWallet() {
    // MetaMask connection state
    const {
        address: metamaskAddress,
        isConnected: isMetaMaskConnected,
        connector
    } = useAccount();
    const {disconnect: disconnectMetaMask} = useDisconnect();

    // Email-based smart account state
    const {
        isAuthenticated: isEmailAuthenticated,
        user: emailUser,
        smartAccountAddress: emailSmartAccountAddress,
        balance: emailBalance,
        loading: emailLoading,
        error: emailError,
        connect: connectEmail,
        disconnect: disconnectEmail,
        sendTransaction: sendEmailTransaction
    } = useBackendSmartAccount();

    // Determine which wallet type is active
    const walletType = isMetaMaskConnected ? 'metamask' : isEmailAuthenticated ? 'email' : null;

    // Unified state
    const isConnected = isMetaMaskConnected || isEmailAuthenticated;
    const userAddress = metamaskAddress || emailSmartAccountAddress;
    const userInfo = isMetaMaskConnected
        ? {type: 'metamask' as const, address: metamaskAddress, connector: connector?.name}
        : emailUser
            ? {type: 'email' as const, ...emailUser, address: emailSmartAccountAddress}
            : null;

    // Unified actions
    const disconnect = async () => {
        if (isMetaMaskConnected) {
            disconnectMetaMask();
        }
        if (isEmailAuthenticated) {
            await disconnectEmail();
        }
    };

    const sendTransaction = async (to: string, data?: string, value?: bigint) => {
        if (isEmailAuthenticated) {
            return await sendEmailTransaction(to as any, data, value);
        } else if (isMetaMaskConnected) {
            // For MetaMask, we'll use the regular transaction flow
            // This would typically involve using wagmi's sendTransaction
            throw new Error('MetaMask transaction sending not implemented yet');
        } else {
            throw new Error('No wallet connected');
        }
    };

    return {
        // Unified state
        isConnected,
        walletType,
        userAddress,
        userInfo,
        loading: emailLoading,
        error: emailError,

        // MetaMask specific
        isMetaMaskConnected,
        metamaskAddress,

        // Email specific
        isEmailAuthenticated,
        emailUser,
        emailSmartAccountAddress,
        emailBalance,

        // Unified actions
        disconnect,
        sendTransaction,

        // Email specific actions
        connectEmail,
    };
}
