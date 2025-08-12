// Base repository interface with common CRUD operations
export interface Repository<T, TCreateInput, TUpdateInput> {
    create(data: TCreateInput): Promise<T>;

    findById(id: string): Promise<T | null>;

    findAll(limit?: number, offset?: number): Promise<T[]>;

    update(id: string, data: TUpdateInput): Promise<T | null>;

    delete(id: string): Promise<boolean>;

    count(): Promise<number>;
}

// Base repository implementation with common functionality
export abstract class BaseRepository<T extends { id: string }, TCreateInput, TUpdateInput>
    implements Repository<T, TCreateInput, TUpdateInput> {

    async create(data: TCreateInput): Promise<T> {
        const id = this.generateId();
        const entity = this.createEntity(id, data);
        this.getStorage().set(id, entity);
        return entity;
    }

    async findById(id: string): Promise<T | null> {
        return this.getStorage().get(id) || null;
    }

    async findAll(limit: number = 100, offset: number = 0): Promise<T[]> {
        const allEntities = Array.from(this.getStorage().values());
        return allEntities.slice(offset, offset + limit);
    }

    async update(id: string, data: TUpdateInput): Promise<T | null> {
        const existing = this.getStorage().get(id);
        if (!existing) {
            return null;
        }

        const updated = {...existing, ...data} as T;
        this.getStorage().set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        return this.getStorage().delete(id);
    }

    async count(): Promise<number> {
        return this.getStorage().size;
    }

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            const storage = this.getStorage();
            return storage instanceof Map;
        } catch {
            return false;
        }
    }

    protected abstract getStorage(): Map<string, T>;

    protected abstract createEntity(id: string, data: TCreateInput): T;

    // Helper method to find entities by a specific field
    protected async findBy<K extends keyof T>(
        field: K,
        value: T[K],
        limit?: number
    ): Promise<T[]> {
        const allEntities = Array.from(this.getStorage().values());
        const filtered = allEntities.filter(entity => entity[field] === value);

        if (limit) {
            return filtered.slice(0, limit);
        }

        return filtered;
    }

    // Helper method to find first entity by a specific field
    protected async findOneBy<K extends keyof T>(field: K, value: T[K]): Promise<T | null> {
        const results = await this.findBy(field, value, 1);
        return results[0] || null;
    }

    // Simple ID generation (in production, use proper UUID library)
    protected generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}
