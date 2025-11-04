import {Address} from 'viem';
import {accountRepository} from '../repositories';
import {createServiceLogger} from '../utils';
import {requestAccount} from '../scripts/alchemyWalletApi';
import {IAccount} from "../models";

const logger = createServiceLogger('AccountService');

export async function createUserAccount(
    userId: string,
    chainId: number,
    accountType: string
): Promise<{ success: boolean, account?: IAccount, error?: Error | string }> {
    try {

        logger.info('Creating new account', {userId, chainId, accountType});

        const alchemyResponse = await requestAccount(userId, chainId, accountType);
        const newAccount = await accountRepository.createAccount({
            userId,
            address: alchemyResponse.accountAddress as Address,
            chainId,
            isDeployed: false,
            balance: '0',
            nonce: 0,
            signerAddress: "CENTRAL_WALLET",
            alchemyAccountId: alchemyResponse.id,
            accountType: accountType,
            factoryAddress: alchemyResponse.counterfactualInfo?.factoryAddress,
            factoryData: alchemyResponse.counterfactualInfo?.factoryData
        });

        logger.info('Created new account via Alchemy', newAccount);

        return {
            success: true,
            account: newAccount
        };

    } catch (error: any) {
        if (error?.message?.includes('already exists')) {
            logger.warn('Account already exists in Alchemy, but not in our database', {
                userId,
                chainId,
                error: error?.message
            });

            return {
                success: false,
                error: 'Account already exists in Alchemy but not found in a local database. Please contact support.'
            };
        }

        logger.error('Failed to get or create account', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create account'
        };
    }
}

export async function getUserAccount(userId: string, chainId: number): Promise<{
    success: boolean;
    account?: IAccount;
    error?: string;
}> {
    try {
        logger.info('Starting account lookup', {userId, chainId});

        const chainAccount = await accountRepository.findBy({userId, chainId});

        if (!chainAccount.length) {
            return {
                success: false,
                error: 'No account found for user'
            };
        }

        logger.info('Account info retrieved', {
            userId,
            address: chainAccount[0].address,
        });

        return {
            success: true,
            account: chainAccount[0]
        };

    } catch (error) {
        logger.error('Failed to get account info', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get account info'
        };
    }
}

export async function getUserAccounts(userId: string, chainId: number): Promise<{
    success: boolean;
    accounts?: IAccount[];
    error?: string;
}> {
    try {
        logger.info('Starting accounts lookup', {userId, chainId});

        const chainAccounts = await accountRepository.findBy({userId, chainId});

        logger.info('Accounts retrieved', {
            userId,
            chainId,
            count: chainAccounts.length
        });

        return {
            success: true,
            accounts: chainAccounts
        };

    } catch (error) {
        logger.error('Failed to get user accounts', error instanceof Error ? error : new Error(String(error)));
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get user accounts'
        };
    }
}

export async function getAccountDetails(address: string, chainId: number
): Promise<{
    success: boolean;
    account?: IAccount;
    error?: string;
}> {
    try {
        const account = await accountRepository.findAccountByAddress(address);
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
