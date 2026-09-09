import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Ledger } from '../../src/core/ledger.js';
import {
  LedgerCorruptedError,
  RunwayNotInitializedError,
} from '../../src/core/errors.js';

describe('Ledger Engine', () => {
  let tmpDir: string;
  let ledger: Ledger;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-ledger-test-'));
    ledger = new Ledger(tmpDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should initialize genesis block and config correctly', async () => {
    expect(ledger.isInitialized()).toBe(false);

    const config = await ledger.initialize({
      budget: 25.0,
      name: 'alpha-agent',
      currency: 'USD',
      killThreshold: 0.5,
      warnThreshold: 5.0,
    });

    expect(ledger.isInitialized()).toBe(true);
    expect(config.agentName).toBe('alpha-agent');
    expect(config.initialBudget).toBe(25.0);

    const txs = ledger.readAllTransactionsSync();
    expect(txs).toHaveLength(1);
    expect(txs[0].index).toBe(0);
    expect(txs[0].type).toBe('INITIAL_BUDGET');
    expect(txs[0].amount).toBe(25.0);
    expect(txs[0].balance).toBe(25.0);
    expect(txs[0].hash).toBeDefined();
  });

  it('should throw RunwayNotInitializedError if accessed before init', () => {
    expect(() => ledger.getConfig()).toThrow(RunwayNotInitializedError);
  });

  it('should record debit and credit transactions with proper balance chaining', async () => {
    await ledger.initialize({ budget: 10.0 });

    // Debit 1: -$1.50
    const d1 = await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -1.5,
      description: 'First inference',
      model: 'gpt-4o',
    });
    expect(d1.index).toBe(1);
    expect(d1.balance).toBe(8.5);

    // Debit 2: -$2.00
    const d2 = await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -2.0,
      description: 'Second inference',
    });
    expect(d2.index).toBe(2);
    expect(d2.balance).toBe(6.5);
    expect(d2.prevHash).toBe(d1.hash);

    // Credit 1: +$5.00
    const c1 = await ledger.recordTransaction({
      type: 'CREDIT',
      amount: 5.0,
      description: 'Bounty reward',
    });
    expect(c1.index).toBe(3);
    expect(c1.balance).toBe(11.5);
    expect(c1.prevHash).toBe(d2.hash);

    const latest = ledger.getLatestTransaction();
    expect(latest?.balance).toBe(11.5);
  });

  it('should cryptographically verify a valid ledger successfully', async () => {
    await ledger.initialize({ budget: 50.0 });

    for (let i = 0; i < 5; i++) {
      await ledger.recordTransaction({
        type: 'DEBIT',
        amount: -1.0,
        description: `Step ${i}`,
      });
    }

    const audit = ledger.verifyLedger();
    expect(audit.valid).toBe(true);
    expect(audit.errors).toHaveLength(0);
    expect(audit.totalTransactions).toBe(6);
    expect(audit.finalBalance).toBe(45.0);
    expect(audit.expectedBalance).toBe(45.0);
  });

  it('should detect hash tampering immediately during audit', async () => {
    await ledger.initialize({ budget: 20.0 });
    await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -5.0,
      description: 'Step 1',
    });

    // Tamper with ledger file: change hash in line 2
    const lines = fs.readFileSync(ledger.ledgerPath, 'utf8').trim().split('\n');
    const tx = JSON.parse(lines[1]);
    tx.hash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    lines[1] = JSON.stringify(tx);
    fs.writeFileSync(ledger.ledgerPath, lines.join('\n') + '\n', 'utf8');

    const audit = ledger.verifyLedger();
    expect(audit.valid).toBe(false);
    expect(audit.errors.some((e) => e.type === 'HASH_MISMATCH')).toBe(true);
  });

  it('should detect balance manipulation tampering during audit', async () => {
    await ledger.initialize({ budget: 20.0 });
    await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -5.0,
      description: 'Step 1',
    });

    // Tamper: change recorded balance without changing amount
    const lines = fs.readFileSync(ledger.ledgerPath, 'utf8').trim().split('\n');
    const tx = JSON.parse(lines[1]);
    tx.balance = 999.0; // Fabricated balance
    lines[1] = JSON.stringify(tx);
    fs.writeFileSync(ledger.ledgerPath, lines.join('\n') + '\n', 'utf8');

    const audit = ledger.verifyLedger();
    expect(audit.valid).toBe(false);
    expect(audit.errors.some((e) => e.type === 'BALANCE_MISMATCH' || e.type === 'HASH_MISMATCH')).toBe(
      true
    );
  });

  it('should detect broken prevHash links during audit', async () => {
    await ledger.initialize({ budget: 20.0 });
    await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -2.0,
      description: 'Step 1',
    });
    await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -3.0,
      description: 'Step 2',
    });

    // Tamper: change prevHash of block 2
    const lines = fs.readFileSync(ledger.ledgerPath, 'utf8').trim().split('\n');
    const tx = JSON.parse(lines[2]);
    tx.prevHash = 'badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb';
    lines[2] = JSON.stringify(tx);
    fs.writeFileSync(ledger.ledgerPath, lines.join('\n') + '\n', 'utf8');

    const audit = ledger.verifyLedger();
    expect(audit.valid).toBe(false);
    expect(audit.errors.some((e) => e.type === 'PREV_HASH_MISMATCH')).toBe(true);
  });

  it('should handle corrupted JSON lines', async () => {
    await ledger.initialize({ budget: 10.0 });
    fs.appendFileSync(ledger.ledgerPath, '{ invalid json line \n', 'utf8');

    expect(() => ledger.readAllTransactionsSync()).toThrow(LedgerCorruptedError);
  });

  it('should export ledger to json, csv, and markdown', async () => {
    await ledger.initialize({ budget: 100.0, name: 'exporter-agent' });
    await ledger.recordTransaction({
      type: 'DEBIT',
      amount: -12.5,
      description: 'Heavy Claude analysis',
      model: 'claude-3-5-sonnet',
      tokens: { promptTokens: 3000, completionTokens: 500, totalTokens: 3500 },
      cost: 12.5,
    });

    // JSON export
    const jsonExport = ledger.export('json');
    const parsed = JSON.parse(jsonExport);
    expect(parsed).toHaveLength(2);

    // CSV export
    const csvExport = ledger.export('csv');
    expect(csvExport).toContain('index,timestamp,type,amount,balance');
    expect(csvExport).toContain('Heavy Claude analysis');
    expect(csvExport).toContain('claude-3-5-sonnet');

    // Markdown export
    const mdExport = ledger.export('markdown');
    expect(mdExport).toContain('# Agent Runway Transaction Ledger');
    expect(mdExport).toContain('| 0 |');
    expect(mdExport).toContain('| 1 |');
    expect(mdExport).toContain('claude-3-5-sonnet');
  });
});
