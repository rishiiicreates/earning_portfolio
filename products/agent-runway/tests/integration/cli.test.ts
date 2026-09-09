import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CLI Integration Tests', () => {
  let tmpDir: string;
  const projectRoot = path.resolve(__dirname, '../../');
  const cliBin = path.join(projectRoot, 'bin/agent-runway.js');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-cli-integration-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  const runCli = (args: string): { stdout: string; status: number } => {
    try {
      const stdout = execSync(`node "${cliBin}" ${args} --dir "${tmpDir}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { stdout, status: 0 };
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; status?: number };
      return {
        stdout: (execErr.stdout || '') + (execErr.stderr || ''),
        status: execErr.status ?? 1,
      };
    }
  };

  it('should initialize a new runway ledger via CLI', () => {
    const { stdout, status } = runCli('init --budget 25.00 --name test-bot --kill-threshold 1.00');
    expect(status).toBe(0);
    expect(stdout).toContain('Agent Runway initialized successfully');
    expect(stdout).toContain('$25.00 USD');
    expect(stdout).toContain('test-bot');

    expect(fs.existsSync(path.join(tmpDir, 'ledger.jsonl'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'config.json'))).toBe(true);
  });

  it('should debit and display status correctly', () => {
    runCli('init --budget 15.00 --name test-bot');

    const debitRes = runCli('debit --amount 3.50 --desc "Vector indexing"');
    expect(debitRes.status).toBe(0);
    expect(debitRes.stdout).toContain('Debit recorded: -$3.5000');
    expect(debitRes.stdout).toContain('Balance:     $11.5000');

    // Debit by tokens
    const tokenRes = runCli('debit --model gpt-4o --tokens 100000,20000');
    expect(tokenRes.status).toBe(0);
    expect(tokenRes.stdout).toContain('Debit recorded');

    // Status query
    const statusRes = runCli('status');
    expect(statusRes.status).toBe(0);
    expect(statusRes.stdout).toContain('AGENT RUNWAY MONITOR');
    expect(statusRes.stdout).toContain('test-bot');

    // JSON status query
    const jsonStatusRes = runCli('status --json');
    expect(jsonStatusRes.status).toBe(0);
    const parsed = JSON.parse(jsonStatusRes.stdout);
    expect(parsed.agentName).toBe('test-bot');
    expect(parsed.totalSpent).toBeGreaterThan(3.5);
  });

  it('should credit funds and reflect updated balance', () => {
    runCli('init --budget 10.00');
    const creditRes = runCli('credit --amount 50.00 --desc "Sponsor payout"');
    expect(creditRes.status).toBe(0);
    expect(creditRes.stdout).toContain('Credit recorded: +$50.0000');
    expect(creditRes.stdout).toContain('$60.0000');
  });

  it('should verify ledger cryptographic integrity', () => {
    runCli('init --budget 20.00');
    runCli('debit --amount 2.00');
    runCli('debit --amount 3.00');

    const verifyRes = runCli('verify');
    expect(verifyRes.status).toBe(0);
    expect(verifyRes.stdout).toContain('AUDIT PASSED');
    expect(verifyRes.stdout).toContain('Total Transactions: 3');

    // JSON verify
    const jsonVerifyRes = runCli('verify --json');
    expect(jsonVerifyRes.status).toBe(0);
    const result = JSON.parse(jsonVerifyRes.stdout);
    expect(result.valid).toBe(true);
    expect(result.totalTransactions).toBe(3);
  });

  it('should trigger kill-switch and exit with code 78 when balance is exhausted', () => {
    runCli('init --budget 5.00 --kill-threshold 1.00');

    // Debit $4.50 -> balance $0.50 <= $1.00 kill threshold
    const res = runCli('debit --amount 4.50');
    expect(res.status).toBe(78);
    expect(res.stdout).toContain('KILL-SWITCH TRIGGERED');
    expect(fs.existsSync(path.join(tmpDir, 'KILLSWITCH'))).toBe(true);
  });

  it('should export ledger to file in CSV and JSON', () => {
    runCli('init --budget 10.00');
    runCli('debit --amount 1.00 --desc "Step 1"');

    const exportPath = path.join(tmpDir, 'exported.csv');
    const exportRes = runCli(`export --format csv --output "${exportPath}"`);
    expect(exportRes.status).toBe(0);
    expect(fs.existsSync(exportPath)).toBe(true);

    const csvContent = fs.readFileSync(exportPath, 'utf8');
    expect(csvContent).toContain('index,timestamp,type');
    expect(csvContent).toContain('Step 1');
  });

  it('should display pricing registry', () => {
    const pricingRes = runCli('pricing gpt-4o');
    expect(pricingRes.status).toBe(0);
    expect(pricingRes.stdout).toContain('gpt-4o');
    expect(pricingRes.stdout).toContain('$2.50');
  });
});
