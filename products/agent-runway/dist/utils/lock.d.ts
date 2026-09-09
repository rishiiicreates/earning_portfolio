interface LockOptions {
    timeoutMs?: number;
    retryIntervalMs?: number;
    staleMs?: number;
}
/**
 * Executes a function holding an exclusive atomic filesystem lock.
 * Uses atomic file creation (`wx` flag) with stale lock detection and retries.
 */
export declare function withLock<T>(lockPath: string, fn: () => Promise<T> | T, options?: LockOptions): Promise<T>;
export {};
//# sourceMappingURL=lock.d.ts.map