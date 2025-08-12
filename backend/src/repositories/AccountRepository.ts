import {BaseRepository} from './BaseRepository';
import {CreateSmartAccountInput, SmartAccount, UpdateSmartAccountInput} from '../models';

// In-memory storage for smart accounts
const accountStorage = new Map<string, SmartAccount>();

export class AccountRepository extends BaseRepository<SmartAccount, CreateSmartAccountInput, UpdateSmartAccountInput> {

    // Override update to set updatedAt
    async update(id: string, data: UpdateSmartAccountInput): Promise<SmartAccount | null> {
        const updateData = {...data, updatedAt: new Date()} as UpdateSmartAccountInput & { updatedAt: Date };
        return super.update(id, updateData);
    }

    // SmartAccount-specific methods
    async findByAddress(address: string): Promise<SmartAccount | null> {
        return this.findOneBy('address', address.toLowerCase());
    }

    async findByUserId(userId: string): Promise<SmartAccount[]> {
        return this.findBy('userId', userId);
    }

    async findByChainId(chainId: number): Promise<SmartAccount[]> {
        return this.findBy('chainId', chainId);
    }

    async findDeployedAccounts(chainId?: number): Promise<SmartAccount[]> {
        const allAccounts = Array.from(this.getStorage().values());
        let filtered = allAccounts.filter(account => account.isDeployed);

        if (chainId !== undefined) {
            filtered = filtered.filter(account => account.chainId === chainId);
        }

        return filtered;
    }

    async findUndeployedAccounts(chainId?: number): Promise<SmartAccount[]> {
        const allAccounts = Array.from(this.getStorage().values());
        let filtered = allAccounts.filter(account => !account.isDeployed);

        if (chainId !== undefined) {
            filtered = filtered.filter(account => account.chainId === chainId);
        }

        return filtered;
    }

    async updateBalance(id: string, balance: string): Promise<SmartAccount | null> {
        return this.update(id, {balance});
    }

    async updateNonce(id: string, nonce: number): Promise<SmartAccount | null> {
        return this.update(id, {nonce});
    }

    async markAsDeployed(id: string): Promise<SmartAccount | null> {
        return this.update(id, {isDeployed: true});
    }

    // Statistics
    async getStats(): Promise<{
        totalAccounts: number;
        deployedAccounts: number;
        undeployedAccounts: number;
        accountsByChain: Record<number, number>;
        totalBalance: string; // sum of all balances
    }> {
        const allAccounts = Array.from(this.getStorage().values());
        const accountsByChain: Record<number, number> = {};
        let totalBalance = BigInt(0);

        for (const account of allAccounts) {
            // Count by chain
            accountsByChain[account.chainId] = (accountsByChain[account.chainId] || 0) + 1;

            // Sum balances
            if (account.balance) {
                try {
                    totalBalance += BigInt(account.balance);
                } catch {
                    // Ignore invalid balance values
                }
            }
        }

        return {
            totalAccounts: allAccounts.length,
            deployedAccounts: allAccounts.filter(a => a.isDeployed).length,
            undeployedAccounts: allAccounts.filter(a => !a.isDeployed).length,
            accountsByChain,
            totalBalance: totalBalance.toString()
        };
    }

    protected getStorage(): Map<string, SmartAccount> {
        return accountStorage;
    }

    protected createEntity(id: string, data: CreateSmartAccountInput): SmartAccount {
        const now = new Date();
        return {
            id,
            userId: data.userId,
            address: data.address,
            chainId: data.chainId,
            isDeployed: data.isDeployed,
            balance: data.balance,
            nonce: data.nonce,
            createdAt: now,
            updatedAt: now
        };
    }
}
