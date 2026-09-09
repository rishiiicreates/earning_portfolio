import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRunway } from '../../src/core/runway.js';
import { RunwayExhaustedError } from '../../src/core/errors.js';

describe('AgentRunway Core', () => {
  let tmpDir: string;
  let runway: AgentRunway;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-core-test-'));
    runway = new AgentRunway(tmpDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should initialize and report correct status', async () => {
    expect(runway.isInitialized()).toBe(false);

    const config = await runway.init({
      budget: 20.0,
      name: 'worker-agent',
      killThreshold: 1.0,
      warnThreshold: 4.0,
    });

    expect(runway.isInitialized()).toBe(true);
    expect(config.initialBudget).toBe(20.0);

    const status = runway.getStatus();
    expect(status.agentName).toBe('worker-agent');
    expect(status.currentBalance).toBe(20.0);
    expect(status.totalSpent).toBe(0);
    expect(status.state).toBe('HEALTHY');
    expect(status.killSwitchActive).toBe(false);
  });

  it('should debit funds by explicit amount', async () => {
    await runway.init({ budget: 10.0 });

    const debitListener = vi.fn();
    runway.on('debit', debitListener);

    const tx = await runway.debit({
      amount: 2.5,
      description: 'Manual task allocation',
    });

    expect(tx.balance).toBe(7.5);
    expect(debitListener).toHaveBeenCalledWith(tx);

    const status = runway.getStatus();
    expect(status.currentBalance).toBe(7.5);
    expect(status.totalSpent).toBe(2.5);
  });

  it('should debit funds automatically using model and tokens', async () => {
    await runway.init({ budget: 10.0 });

    // gpt-4o: $2.50 / 1M prompt, $10 / 1M completion
    // 200,000 prompt = $0.50, 50,000 comp = $0.50 -> $1.00
    const tx = await runway.debit({
      model: 'gpt-4o',
      tokens: {
        promptTokens: 200_000,
        completionTokens: 50_000,
      },
    });

    expect(tx.cost).toBeCloseTo(1.0, 4);
    expect(tx.balance).toBeCloseTo(9.0, 4);

    const status = runway.getStatus();
    expect(status.tokens.totalPrompt).toBe(200_000);
    expect(status.tokens.totalCompletion).toBe(50_000);
    expect(status.tokens.totalAll).toBe(250_000);
  });

  it('should emit throttle event and advice when balance enters warning range', async () => {
    await runway.init({ budget: 10.0, warnThreshold: 4.0, killThreshold: 1.0 });

    const throttleListener = vi.fn();
    runway.on('throttle', throttleListener);

    // Debit $7.00 -> balance $3.00 <= $4.00 warn threshold
    await runway.debit({
      amount: 7.0,
      description: 'Big debit',
    });

    expect(throttleListener).toHaveBeenCalled();
    const status = runway.getStatus();
    expect(status.state).toBe('THROTTLED');
    expect(status.throttleAdvice).toBeDefined();
    expect(status.throttleAdvice?.rateLimitDelayMs).toBeGreaterThan(0);
  });

  it('should arm kill-switch and throw RunwayExhaustedError when budget depleted', async () => {
    await runway.init({ budget: 5.0, killThreshold: 1.0 });

    const killSwitchListener = vi.fn();
    runway.on('killswitch', killSwitchListener);

    // Debit $4.50 -> balance $0.50 <= $1.00 kill threshold
    await expect(
      runway.debit({
        amount: 4.5,
        description: 'Exhausting debit',
      })
    ).rejects.toThrow(RunwayExhaustedError);

    expect(runway.guard.isKillSwitchActive()).toBe(true);
    expect(killSwitchListener).toHaveBeenCalled();

    // Subsequent debit should be blocked before execution
    await expect(
      runway.debit({
        amount: 0.1,
      })
    ).rejects.toThrow(RunwayExhaustedError);
  });

  it('should credit funds and automatically disarm kill-switch', async () => {
    await runway.init({ budget: 2.0, killThreshold: 1.0 });

    // Exhaust runway
    try {
      await runway.debit({ amount: 1.5 });
    } catch {
      // Expected
    }
    expect(runway.guard.isKillSwitchActive()).toBe(true);

    // Credit $10.00
    const tx = await runway.credit({
      amount: 10.0,
      description: 'Emergency deposit',
    });

    expect(tx.balance).toBeGreaterThan(1.0);
    expect(runway.guard.isKillSwitchActive()).toBe(false);
    expect(runway.getStatus().killSwitchActive).toBe(false);
  });

  it('should perform non-throwing canExecute check', async () => {
    await runway.init({ budget: 5.0, killThreshold: 1.0 });

    expect(runway.canExecute(2.0)).toBe(true);
    expect(runway.canExecute(4.5)).toBe(false); // 5 - 4.5 = 0.5 <= 1.0
  });

  it('should wrap tools and enforce guard checks', async () => {
    await runway.init({ budget: 10.0, killThreshold: 1.0 });

    const dummyTool = async (args: { query: string }) => {
      return `Result for ${args.query}`;
    };

    const wrapped = runway.wrapTool('search', dummyTool, {
      estimatedCost: 0.05,
    });

    const result = await wrapped({ query: 'quantum computing' });
    expect(result).toBe('Result for quantum computing');

    const status = runway.getStatus();
    expect(status.currentBalance).toBe(9.95);
  });
});
