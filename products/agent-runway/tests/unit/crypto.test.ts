import { describe, it, expect } from 'vitest';
import {
  sha256,
  canonicalizeTransaction,
  computeTransactionHash,
  GENESIS_PREV_HASH,
} from '../../src/utils/crypto.js';
import type { Transaction } from '../../src/core/types.js';

describe('Crypto Utilities', () => {
  it('should compute valid SHA-256 hash', () => {
    const hash = sha256('agent-runway');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    // Known SHA-256 for 'agent-runway'
    expect(sha256('agent-runway')).toBe(hash);
  });

  it('should produce deterministic canonical representation', () => {
    const tx: Omit<Transaction, 'hash'> = {
      index: 1,
      timestamp: '2026-09-09T12:00:00.000Z',
      type: 'DEBIT',
      amount: -0.05,
      balance: 9.95,
      currency: 'USD',
      model: 'gpt-4o',
      tokens: {
        promptTokens: 1000,
        completionTokens: 200,
        cachedPromptTokens: 500,
        totalTokens: 1200,
      },
      cost: 0.05,
      description: 'Test debit',
      agentId: 'subagent-1',
      toolCall: { name: 'search_web' },
      prevHash: GENESIS_PREV_HASH,
    };

    const canonical1 = canonicalizeTransaction(tx);
    const canonical2 = canonicalizeTransaction(tx);
    expect(canonical1).toBe(canonical2);
    expect(canonical1).toContain('idx=1');
    expect(canonical1).toContain('amt=-0.050000');
    expect(canonical1).toContain('bal=9.950000');
    expect(canonical1).toContain('model=gpt-4o');
    expect(canonical1).toContain('pt=1000');
    expect(canonical1).toContain('ct=200');
    expect(canonical1).toContain('cached=500');
    expect(canonical1).toContain('tool=search_web');
    expect(canonical1).toContain('agent=subagent-1');
  });

  it('should handle optional/empty fields in canonicalization', () => {
    const tx: Omit<Transaction, 'hash'> = {
      index: 0,
      timestamp: '2026-09-09T12:00:00.000Z',
      type: 'INITIAL_BUDGET',
      amount: 10,
      balance: 10,
      currency: 'USD',
      description: 'Genesis',
      prevHash: GENESIS_PREV_HASH,
    };

    const canonical = canonicalizeTransaction(tx);
    expect(canonical).toContain('pt=0');
    expect(canonical).toContain('ct=0');
    expect(canonical).toContain('model=');
    expect(canonical).toContain('tool=');
  });

  it('should compute consistent transaction hash', () => {
    const tx: Omit<Transaction, 'hash'> = {
      index: 0,
      timestamp: '2026-09-09T12:00:00.000Z',
      type: 'INITIAL_BUDGET',
      amount: 50,
      balance: 50,
      currency: 'USD',
      description: 'Genesis block',
      prevHash: GENESIS_PREV_HASH,
    };

    const hash = computeTransactionHash(tx);
    expect(hash).toHaveLength(64);
    expect(computeTransactionHash(tx)).toBe(hash);
  });
});
