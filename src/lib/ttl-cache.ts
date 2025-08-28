// TTL Cache implementation with automatic cleanup and expiration
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export class TTLCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private readonly ttl: number;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private cleanupHandlersAttached = false;
    private exitListener?: () => void;
    private sigintListener?: () => void;
    private sigtermListener?: () => void;

    constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
        this.ttl = ttlMs;
        this.startPeriodicCleanup();
        this.attachProcessCleanupHandlers();
    }

    private attachProcessCleanupHandlers() {
        if (this.cleanupHandlersAttached) return;
        this.cleanupHandlersAttached = true;

        // Store listener references for cleanup
        this.exitListener = () => {
            this.destroy();
        };

        this.sigintListener = () => {
            this.destroy();
        };

        this.sigtermListener = () => {
            this.destroy();
        };

        // Attach listeners
        process.on('exit', this.exitListener);
        process.on('SIGINT', this.sigintListener);
        process.on('SIGTERM', this.sigtermListener);
    }

    private removeProcessCleanupHandlers() {
        if (!this.cleanupHandlersAttached) return;

        // Remove listeners using stored references
        if (this.exitListener) {
            process.removeListener('exit', this.exitListener);
            this.exitListener = undefined;
        }

        if (this.sigintListener) {
            process.removeListener('SIGINT', this.sigintListener);
            this.sigintListener = undefined;
        }

        if (this.sigtermListener) {
            process.removeListener('SIGTERM', this.sigtermListener);
            this.sigtermListener = undefined;
        }

        this.cleanupHandlersAttached = false;
    }

    private startPeriodicCleanup() {
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            console.log(`Cleaned up expired cache entry: ${key}`);
        });

        if (keysToDelete.length > 0) {
            console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
        }
    }

    get(key: string): CacheEntry<T> | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        const now = Date.now();
        if (now > entry.expiresAt) {
            // Entry expired, remove it
            this.cache.delete(key);
            console.log(`Removed expired cache entry: ${key}`);
            return undefined;
        }

        return entry;
    }

    set(key: string, data: T): void {
        const now = Date.now();
        const entry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiresAt: now + this.ttl
        };

        this.cache.set(key, entry);
        console.log(`Cached data for key: ${key}, expires at: ${new Date(entry.expiresAt).toISOString()}`);
    }

    clear(): void {
        this.cache.clear();
        console.log('Cache cleared');
    }

    size(): number {
        return this.cache.size;
    }

    destroy(): void {
        // Remove process listeners first
        this.removeProcessCleanupHandlers();

        // Clear periodic cleanup
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Clear cache
        this.cache.clear();

        console.log('TTLCache destroyed and cleaned up');
    }

    // Add statistics method for debugging
    stats(): { size: number; entries: string[] } {
        const entries = Array.from(this.cache.keys());
        return {
            size: this.cache.size,
            entries
        };
    }
}
