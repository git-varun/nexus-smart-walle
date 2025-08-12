import {accountRepository} from '../repositories';
import {AlchemyService} from './AlchemyService';
import {createServiceLogger} from '../utils/logger';

const logger = createServiceLogger('AccountService');

export interface AccountInfo {
    id: string;
    address: string;
    chainId: number;
    isDeployed: boolean;
    balance?: string;
    nonce?: number;
    createdAt: Date;
    updatedAt: Date;
}

export class AccountService {
    private alchemyService: AlchemyService;

    constructor() {
        this.alchemyService = new AlchemyService();
    }

    async createOrGetSmartAccount(userId: string, email: string): Promise<{
        success: boolean;
        account?: AccountInfo;
        error?: string;
    }> {
        try {
            logger.info('Creating or getting smart account', {userId, email});

            // Authenticate with Alchemy to get smart account address
            const authResult = await this.alchemyService.authenticate(email);
            if (!authResult.success) {
                return {
                    success: false,
                    error: authResult.error || 'Failed to authenticate with Alchemy'
                };
            }

            // Get smart account address from Alchemy
            const addressResult = await this.alchemyService.getSmartAccountAddress();
            if (!addressResult.success) {
                return {
                    success: false,
                    error: addressResult.error || 'Failed to get smart account address'
                };
            }

            const address = addressResult.data!;

            // Check if account already exists in database
            let dbAccount = await accountRepository.findByAddress(address);

            if (!dbAccount) {
                // Get account info from Alchemy
                const alchemyAccountResult = await this.alchemyService.getAccountInfo();
                if (!alchemyAccountResult.success) {
                    return {
                        success: false,
                        error: alchemyAccountResult.error || 'Failed to get account info'
                    };
                }

                const alchemyAccount = alchemyAccountResult.data!;

                // Create new account in database
                dbAccount = await accountRepository.create({
                    userId,
                    address: alchemyAccount.address,
                    chainId: 84532, // Base Sepolia
                    isDeployed: alchemyAccount.isDeployed,
                    balance: alchemyAccount.balance?.toString(),
                    nonce: Number(alchemyAccount.nonce)
                });

                logger.info('Smart account created in database', {
                    accountId: dbAccount.id,
                    address: dbAccount.address
                });
            } else {
                // Update existing account with fresh data from Alchemy
                const alchemyAccountResult = await this.alchemyService.getAccountInfo();
                if (alchemyAccountResult.success) {
                    const alchemyAccount = alchemyAccountResult.data!;
                    dbAccount = await accountRepository.update(dbAccount.id, {
                        isDeployed: alchemyAccount.isDeployed,
                        balance: alchemyAccount.balance?.toString(),
                        nonce: Number(alchemyAccount.nonce)
                    });
                }

                logger.info('Smart account updated', {
                    accountId: dbAccount!.id,
                    address: dbAccount!.address
                });
            }

            return {
                success: true,
                account: {
                    id: dbAccount!.id,
                    address: dbAccount!.address,
                    chainId: dbAccount!.chainId,
                    isDeployed: dbAccount!.isDeployed,
                    balance: dbAccount!.balance,
                    nonce: dbAccount!.nonce,
                    createdAt: dbAccount!.createdAt,
                    updatedAt: dbAccount!.updatedAt
                }
            };

        } catch (error) {
            logger.error('Create or get smart account failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create or get smart account'
            };
        }
    }

    async getAccountByAddress(address: string): Promise<{
        success: boolean;
        account?: AccountInfo;
        error?: string;
    }> {
        try {
            logger.info('Getting account by address', {address});

            const dbAccount = await accountRepository.findByAddress(address);
            if (!dbAccount) {
                return {
                    success: false,
                    error: 'Account not found'
                };
            }

            // Optionally refresh account info from Alchemy
            const alchemyAccountResult = await this.alchemyService.getAccountInfo();
            if (alchemyAccountResult.success) {
                const alchemyAccount = alchemyAccountResult.data!;
                const updatedAccount = await accountRepository.update(dbAccount.id, {
                    isDeployed: alchemyAccount.isDeployed,
                    balance: alchemyAccount.balance?.toString(),
                    nonce: Number(alchemyAccount.nonce)
                });

                if (updatedAccount) {
                    return {
                        success: true,
                        account: {
                            id: updatedAccount.id,
                            address: updatedAccount.address,
                            chainId: updatedAccount.chainId,
                            isDeployed: updatedAccount.isDeployed,
                            balance: updatedAccount.balance,
                            nonce: updatedAccount.nonce,
                            createdAt: updatedAccount.createdAt,
                            updatedAt: updatedAccount.updatedAt
                        }
                    };
                }
            }

            return {
                success: true,
                account: {
                    id: dbAccount.id,
                    address: dbAccount.address,
                    chainId: dbAccount.chainId,
                    isDeployed: dbAccount.isDeployed,
                    balance: dbAccount.balance,
                    nonce: dbAccount.nonce,
                    createdAt: dbAccount.createdAt,
                    updatedAt: dbAccount.updatedAt
                }
            };

        } catch (error) {
            logger.error('Get account by address failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get account'
            };
        }
    }

    async getUserAccounts(userId: string): Promise<{
        success: boolean;
        accounts?: AccountInfo[];
        error?: string;
    }> {
        try {
            logger.info('Getting user accounts', {userId});

            const dbAccounts = await accountRepository.findByUserId(userId);

            const accounts: AccountInfo[] = dbAccounts.map((account: any) => ({
                id: account.id,
                address: account.address,
                chainId: account.chainId,
                isDeployed: account.isDeployed,
                balance: account.balance,
                nonce: account.nonce,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt
            }));

            return {
                success: true,
                accounts
            };

        } catch (error) {
            logger.error('Get user accounts failed', error instanceof Error ? error : new Error(String(error)));
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get user accounts'
            };
        }
    }
}
