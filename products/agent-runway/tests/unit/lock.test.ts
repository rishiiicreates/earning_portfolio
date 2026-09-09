import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { withLock } from '../../src/utils/lock.js';
import { LockAcquisitionError } from '../../src/core/errors.js';

describe('Lock Utility', () => {
  let tmpDir: string;
  let lockPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-lock-test-'));
    lockPath = path.join(tmpDir, '.test.lock');
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should acquire lock and execute critical section', async () => {
    let executed = false;
    const result = await withLock(lockPath, () => {
      executed = true;
      expect(fs.existsSync(lockPath)).toBe(true);
      return 42;
    });

    expect(executed).toBe(true);
    expect(result).toBe(42);
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('should handle concurrent locks sequentially without data corruption', async () => {
    const sequence: number[] = [];

    const p1 = withLock(lockPath, async () => {
      await new Promise((r) => setTimeout(r, 40));
      sequence.push(1);
    });

    const p2 = withLock(lockPath, async () => {
      await new Promise((r) => setTimeout(r, 20));
      sequence.push(2);
    });

    await Promise.all([p1, p2]);
    expect(sequence).toHaveLength(2);
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('should release lock even if function throws error', async () => {
    await expect(
      withLock(lockPath, () => {
        throw new Error('Failure inside critical section');
      })
    ).rejects.toThrow('Failure inside critical section');

    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it('should time out if lock is permanently held and not stale', async () => {
    // Hold lock manually
    const fd = fs.openSync(lockPath, 'wx');
    fs.writeSync(fd, JSON.stringify({ pid: process.pid, time: Date.now() }));

    try {
      await expect(
        withLock(lockPath, () => 1, { timeoutMs: 150, retryIntervalMs: 20, staleMs: 10000 })
      ).rejects.toThrow(LockAcquisitionError);
    } finally {
      fs.closeSync(fd);
    }
  });

  it('should break stale lock and succeed', async () => {
    // Write stale lock file (older than staleMs)
    fs.writeFileSync(lockPath, JSON.stringify({ pid: 999999, time: Date.now() - 5000 }));
    // Change mtime to 5 seconds ago
    const past = new Date(Date.now() - 5000);
    fs.utimesSync(lockPath, past, past);

    const result = await withLock(lockPath, () => 'recovered', {
      timeoutMs: 1000,
      retryIntervalMs: 20,
      staleMs: 1000,
    });

    expect(result).toBe('recovered');
    expect(fs.existsSync(lockPath)).toBe(false);
  });
});
