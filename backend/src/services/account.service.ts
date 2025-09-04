import {Address, createPublicClient, http} from 'viem';
import {baseSepolia} from 'viem/chains';
import {config} from '../config';
import {SmartAccount, SmartAccountResult} from '../types';
import {accountRepository} from '../repositories';
import {createServiceLogger} from '../utils';
import {requestAccount} from '../scripts/alchemyWalletApi';
import * as ethers from 'ethers';

const logger = createServiceLogger('AccountService');

let publicClient: any = null;


function getPublicClient() {
    if (!publicClient) {
        publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(`https://base-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`)
        });
    }
    return publicClient;
}

export async function getOrCreateUserAccount(
    userId: string,
    chainId: number
): Promise<SmartAccountResult> {
    try {
        logger.info('Starting account lookup', {userId, chainId});

        const existingAccounts = await accountRepository.findByUserId(userId);

        logger.info('Database lookup result', {
            userId,
            chainId,
            accountsFound: existingAccounts.length,
            accounts: existingAccounts.map(acc => ({
                id: acc.id,
                address: acc.address,
                chainId: acc.chainId,
                alchemyAccountId: acc.alchemyAccountId
            }))
        });

        const chainAccount = existingAccounts.find(acc => Number(acc.chainId) === Number(chainId));

        if (chainAccount) {
            logger.info('Found existing account for chain', {
                userId,
                chainId,
                accountId: chainAccount.id,
                address: chainAccount.address
            });

            const client = getPublicClient();
            const balance = await client.getBalance({address: chainAccount.address as Address});

            const updatedAccount = await accountRepository.update(chainAccount.id, {
                balance: balance.toString()
            });

            logger.info('Using existing account', {userId, address: chainAccount.address});

            return {
                success: true,
                account: updatedAccount || undefined
            };
        }

        logger.info('No existing account found for chain, creating new one', {userId, chainId});

        // Generate a new signer address using central wallet as base
        const wallet = new ethers.Wallet(config.centralWallet.privateKey);
        const signerAddress = wallet.address;

        // Generate UUID and creation parameters that we'll send to Alchemy
        const requestId = crypto.randomUUID();

        // Generate unique salt based on userId to avoid conflicts
        const saltBuffer = ethers.keccak256(ethers.toUtf8Bytes(userId + chainId.toString()));
        const salt = saltBuffer.slice(0, 10); // Use first 8 bytes + 0x prefix = 10 chars

        const accountType = "sma-b";

        logger.info('Creating new account via Alchemy', {
            userId,
            signerAddress,
            chainId,
            requestId,
            salt,
            accountType
        });

        try {
            // Call Alchemy requestAccount API with proper parameters
            const alchemyResponse = await requestAccount(signerAddress, {
                id: requestId,
                salt: salt,
                accountType: accountType
            });

            const newAccount = await accountRepository.create({
                userId,
                address: alchemyResponse.accountAddress as Address,
                chainId,
                isDeployed: false,
                balance: '0',
                nonce: 0,
                signerAddress: signerAddress as Address,
                alchemyAccountId: alchemyResponse.id,
                requestId: requestId,
                salt: salt,
                accountType: accountType,
                factoryAddress: alchemyResponse.counterfactualInfo?.factoryAddress
            });

            logger.info('Created new account via Alchemy', {
                userId,
                address: alchemyResponse.accountAddress,
                alchemyAccountId: alchemyResponse.id,
                requestId: requestId,
                salt: salt,
                accountType: accountType,
                factoryAddress: alchemyResponse.counterfactualInfo?.factoryAddress
            });

            return {
                success: true,
                account: newAccount
            };

        } catch (alchemyError: any) {
            // Handle specific case where account already exists
            if (alchemyError.message?.includes('already exists')) {
                logger.warn('Account already exists in Alchemy, but not in our database', {
                    userId,
                    signerAddress,
                    salt,
                    chainId,
                    error: alchemyError.message
                });

                // For now, return an error - in production you might want to query Alchemy
                // for the existing account details
                return {
                    success: false,
                    error: 'Account already exists in Alchemy but not found in local database. Please contact support.'
                };
            }

            // Re-throw other Alchemy errors
            throw alchemyError;
        }

    } catch (error) {
        logger.error('Failed to get or create account', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create account'
        };
    }
}

export async function getUserAccountInfo(userId: string, chainId: number): Promise<{
    success: boolean;
    account?: SmartAccount;
    error?: string;
}> {
    try {
        const accounts = await accountRepository.findByUserId(userId);
        const chainAccount = accounts.find(acc => acc.chainId === chainId);

        if (!chainAccount) {
            return {
                success: false,
                error: 'No account found for user'
            };
        }

        const client = getPublicClient();
        const balance = await client.getBalance({address: chainAccount.address as Address});

        const updatedAccount = await accountRepository.update(chainAccount.id, {
            balance: balance.toString()
        });

        return {
            success: true,
            account: updatedAccount || undefined
        };

    } catch (error) {
        logger.error('Failed to get account info', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get account info'
        };
    }
}

export async function getAccountDetails(address: string, chainId: number
): Promise<{
    success: boolean;
    account?: SmartAccount;
    error?: string;
}> {
    try {
        const account = await accountRepository.findByAddress(address);
        if (!account) {
            return {
                success: false,
                error: 'Account not found'
            };
        }

        if (account.chainId !== chainId) {
            return {
                success: false,
                error: `Account found but on a different chain. Expected: ${chainId}, Found: ${account.chainId}`
            };
        }

        logger.info('Account details retrieved', {address, chainId});

        return {
            success: true,
            account
        };

    } catch (error) {
        logger.error('Failed to get account details', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get account details'
        };
    }
}
