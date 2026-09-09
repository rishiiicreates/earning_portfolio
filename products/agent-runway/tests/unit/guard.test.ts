import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RunwayGuard } from '../../src/core/guard.js';
import { RunwayExhaustedError } from '../../src/core/errors.js';

describe('RunwayGuard', () => {
  let tmpDir: string;
  let guard: RunwayGuard;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-guard-test-'));
    guard = new RunwayGuard({
      runwayDir: tmpDir,
      killThreshold: 1.0,
      warnThreshold: 5.0,
      agentName: 'test-agent',
    });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should accurately evaluate health states', () => {
    expect(guard.evaluateState(10.0)).toBe('HEALTHY');
    expect(guard.evaluateState(5.0)).toBe('THROTTLED');
    expect(guard.evaluateState(3.0)).toBe('THROTTLED');
    expect(guard.evaluateState(1.0)).toBe('KILLSWITCH');
    expect(guard.evaluateState(0.5)).toBe('KILLSWITCH');
  });

  it('should arm and disarm physical kill-switch sentinel file', () => {
    expect(guard.isKillSwitchActive()).toBe(false);

    guard.armKillSwitch(0.5, 'Test budget exhaustion');
    expect(guard.isKillSwitchActive()).toBe(true);

    const sentinelContent = JSON.parse(
      fs.readFileSync(guard.getKillSwitchPath(), 'utf8')
    );
    expect(sentinelContent.agentName).toBe('test-agent');
    expect(sentinelContent.balance).toBe(0.5);
    expect(sentinelContent.killThreshold).toBe(1.0);
    expect(sentinelContent.reason).toBe('Test budget exhaustion');

    const disarmed = guard.disarmKillSwitch();
    expect(disarmed).toBe(true);
    expect(guard.isKillSwitchActive()).toBe(false);
  });

  it('should enforce pre-flight assertion when healthy', () => {
    // Current balance $10, estimated cost $2 -> balance $8 > $1.0 (kill threshold)
    expect(() => guard.assertExecutionPermitted(10.0, 2.0)).not.toThrow();
  });

  it('should trigger kill-switch when estimated cost breaches threshold', () => {
    // Current balance $2.0, estimated cost $1.5 -> $0.5 <= $1.0
    expect(() => guard.assertExecutionPermitted(2.0, 1.5)).toThrow(
      RunwayExhaustedError
    );
    expect(guard.isKillSwitchActive()).toBe(true);
  });

  it('should reject execution immediately if sentinel file exists', () => {
    guard.armKillSwitch(0.0, 'Manual trigger');
    expect(() => guard.assertExecutionPermitted(100.0, 0.01)).toThrow(
      RunwayExhaustedError
    );
  });

  it('should provide throttle advice when in warning zone', () => {
    const noAdvice = guard.getThrottleAdvice(8.0);
    expect(noAdvice).toBeUndefined();

    const advice = guard.getThrottleAdvice(2.5, 'claude-3-5-sonnet');
    expect(advice).toBeDefined();
    expect(advice?.suggestedFallbackModels).toContain('claude-3-5-haiku');
    expect(advice?.rateLimitDelayMs).toBeGreaterThan(0);
    expect(advice?.reductionPercentage).toBeGreaterThanOrEqual(50);
  });
});
