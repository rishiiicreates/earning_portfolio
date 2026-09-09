import * as fs from 'node:fs';
import { LockAcquisitionError } from '../core/errors.js';
/**
 * Executes a function holding an exclusive atomic filesystem lock.
 * Uses atomic file creation (`wx` flag) with stale lock detection and retries.
 */
export async function withLock(lockPath, fn, options = {}) {
    const timeoutMs = options.timeoutMs ?? 5000;
    const retryIntervalMs = options.retryIntervalMs ?? 50;
    const staleMs = options.staleMs ?? 10000;
    const startTime = Date.now();
    let acquired = false;
    let lockFd = null;
    while (Date.now() - startTime < timeoutMs) {
        try {
            // Atomic open with exclusive flag
            lockFd = fs.openSync(lockPath, 'wx');
            const lockData = JSON.stringify({
                pid: process.pid,
                time: Date.now(),
            });
            fs.writeSync(lockFd, lockData);
            acquired = true;
            break;
        }
        catch (err) {
            const code = err.code;
            if (code === 'EEXIST') {
                // Check if lock file is stale
                try {
                    const stat = fs.statSync(lockPath);
                    if (Date.now() - stat.mtimeMs > staleMs) {
                        // Lock is older than stale threshold, break it
                        try {
                            fs.unlinkSync(lockPath);
                        }
                        catch {
                            // Ignore race condition if another process unlinked it
                        }
                    }
                }
                catch {
                    // File might have been removed already, loop again
                }
                // Wait before retrying with small jitter
                const jitter = Math.floor(Math.random() * 20);
                await new Promise((resolve) => setTimeout(resolve, retryIntervalMs + jitter));
            }
            else {
                throw err;
            }
        }
    }
    if (!acquired) {
        throw new LockAcquisitionError(lockPath, timeoutMs);
    }
    try {
        return await fn();
    }
    finally {
        if (lockFd !== null) {
            try {
                fs.closeSync(lockFd);
            }
            catch {
                // Ignore close errors
            }
        }
        try {
            if (fs.existsSync(lockPath)) {
                fs.unlinkSync(lockPath);
            }
        }
        catch {
            // Ignore unlink errors
        }
    }
}
//# sourceMappingURL=lock.js.map