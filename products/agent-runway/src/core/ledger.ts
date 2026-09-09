import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  Transaction,
  TransactionType,
  RunwayConfig,
  VerificationResult,
  VerificationError,
  InitOptions,
} from './types.js';
import {
  GENESIS_PREV_HASH,
  computeTransactionHash,
} from '../utils/crypto.js';
import { withLock } from '../utils/lock.js';
import {
  LedgerCorruptedError,
  RunwayNotInitializedError,
} from './errors.js';

export class Ledger {
  public readonly runwayDir: string;
  public readonly ledgerPath: string;
  public readonly configPath: string;
  public readonly statePath: string;
  public readonly lockPath: string;

  constructor(runwayDir: string = '.runway') {
    this.runwayDir = path.resolve(runwayDir);
    this.ledgerPath = path.join(this.runwayDir, 'ledger.jsonl');
    this.configPath = path.join(this.runwayDir, 'config.json');
    this.statePath = path.join(this.runwayDir, 'state.json');
    this.lockPath = path.join(this.runwayDir, '.lock');
  }

  /**
   * Checks if the runway ledger is initialized.
   */
  public isInitialized(): boolean {
    return fs.existsSync(this.configPath) && fs.existsSync(this.ledgerPath);
  }

  /**
   * Initializes a new runway ledger with a genesis budget transaction.
   */
  public async initialize(options: InitOptions = {}): Promise<RunwayConfig> {
    const budget = options.budget ?? 10.0;
    const name = options.name ?? 'autonomous-agent';
    const currency = options.currency ?? 'USD';
    const killThreshold = options.killThreshold ?? 0.0;
    const warnThreshold = options.warnThreshold ?? Number((budget * 0.2).toFixed(2));

    if (this.isInitialized() && !options.overwrite) {
      return this.getConfig();
    }

    fs.mkdirSync(this.runwayDir, { recursive: true });

    return await withLock(this.lockPath, async () => {
      const now = new Date().toISOString();
      const config: RunwayConfig = {
        version: '1.0.0',
        agentName: name,
        initialBudget: budget,
        currency,
        killThreshold,
        warnThreshold,
        createdAt: now,
        updatedAt: now,
      };

      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');

      // Create Genesis block
      const genesisPayload: Omit<Transaction, 'hash'> = {
        index: 0,
        timestamp: now,
        type: 'INITIAL_BUDGET',
        amount: budget,
        balance: budget,
        currency,
        description: `Genesis balance initialized for ${name}`,
        prevHash: GENESIS_PREV_HASH,
      };

      const genesisHash = computeTransactionHash(genesisPayload);
      const genesisTx: Transaction = {
        ...genesisPayload,
        hash: genesisHash,
      };

      fs.writeFileSync(this.ledgerPath, JSON.stringify(genesisTx) + '\n', 'utf8');

      // Update cached state
      this.writeStateCache(genesisTx.balance, 0, budget, 1);

      return config;
    });
  }

  /**
   * Reads and parses runway configuration.
   */
  public getConfig(): RunwayConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new RunwayNotInitializedError(this.runwayDir);
    }
    const raw = fs.readFileSync(this.configPath, 'utf8');
    return JSON.parse(raw) as RunwayConfig;
  }

  /**
   * Appends a new transaction atomically with strict cryptographic hash chaining.
   */
  public async recordTransaction(entry: {
    type: TransactionType;
    amount: number; // positive for credit, negative for debit
    description: string;
    model?: string;
    tokens?: Transaction['tokens'];
    cost?: number;
    agentId?: string;
    toolCall?: Transaction['toolCall'];
    metadata?: Record<string, unknown>;
  }): Promise<Transaction> {
    if (!this.isInitialized()) {
      throw new RunwayNotInitializedError(this.runwayDir);
    }

    return await withLock(this.lockPath, async () => {
      const transactions = this.readAllTransactionsSync();
      if (transactions.length === 0) {
        throw new LedgerCorruptedError('Ledger is empty: missing genesis block.');
      }

      const lastTx = transactions[transactions.length - 1];
      const newIndex = lastTx.index + 1;
      const newBalance = Number((lastTx.balance + entry.amount).toFixed(6));

      const now = new Date().toISOString();
      const config = this.getConfig();

      const txPayload: Omit<Transaction, 'hash'> = {
        index: newIndex,
        timestamp: now,
        type: entry.type,
        amount: Number(entry.amount.toFixed(6)),
        balance: newBalance,
        currency: config.currency,
        model: entry.model,
        tokens: entry.tokens,
        cost: entry.cost !== undefined ? Number(entry.cost.toFixed(6)) : undefined,
        description: entry.description,
        agentId: entry.agentId,
        toolCall: entry.toolCall,
        metadata: entry.metadata,
        prevHash: lastTx.hash,
      };

      const txHash = computeTransactionHash(txPayload);
      const tx: Transaction = {
        ...txPayload,
        hash: txHash,
      };

      // Append-only write
      fs.appendFileSync(this.ledgerPath, JSON.stringify(tx) + '\n', 'utf8');

      // Update state cache
      const totalSpent = transactions
        .concat(tx)
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalCredited = transactions
        .concat(tx)
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      this.writeStateCache(newBalance, totalSpent, totalCredited, newIndex + 1);

      return tx;
    });
  }

  /**
   * Reads all transactions synchronously.
   */
  public readAllTransactionsSync(): Transaction[] {
    if (!fs.existsSync(this.ledgerPath)) {
      return [];
    }

    const content = fs.readFileSync(this.ledgerPath, 'utf8').trim();
    if (!content) {
      return [];
    }

    const lines = content.split('\n');
    const transactions: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        const parsed = JSON.parse(line) as Transaction;
        transactions.push(parsed);
      } catch (err: unknown) {
        throw new LedgerCorruptedError(`Corrupted JSON line at ${i + 1}: ${line}`, {
          lineIndex: i + 1,
          raw: line,
        });
      }
    }

    return transactions;
  }

  /**
   * Retrieves the latest transaction and current balance.
   */
  public getLatestTransaction(): Transaction | null {
    const transactions = this.readAllTransactionsSync();
    return transactions.length > 0 ? transactions[transactions.length - 1] : null;
  }

  /**
   * Performs an exhaustive cryptographic and accounting audit of the ledger.
   */
  public verifyLedger(): VerificationResult {
    const transactions = this.readAllTransactionsSync();
    const errors: VerificationError[] = [];

    if (transactions.length === 0) {
      return {
        valid: false,
        totalTransactions: 0,
        genesisHash: '',
        latestHash: '',
        finalBalance: 0,
        expectedBalance: 0,
        errors: [
          {
            index: -1,
            type: 'CORRUPTED_ENTRY',
            message: 'Ledger contains no transactions.',
          },
        ],
      };
    }

    let runningBalance = 0;
    let expectedPrevHash = GENESIS_PREV_HASH;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      // 1. Verify index sequence
      if (tx.index !== i) {
        errors.push({
          index: i,
          type: 'CORRUPTED_ENTRY',
          message: `Transaction index mismatch: expected ${i}, found ${tx.index}`,
        });
      }

      // 2. Verify hash chain link
      if (tx.prevHash !== expectedPrevHash) {
        errors.push({
          index: i,
          type: 'PREV_HASH_MISMATCH',
          message: `Block ${i} prevHash mismatch. Expected '${expectedPrevHash}', got '${tx.prevHash}'`,
          details: { expected: expectedPrevHash, actual: tx.prevHash },
        });
      }

      // 3. Verify SHA-256 block hash computation
      const calculatedHash = computeTransactionHash(tx);
      if (tx.hash !== calculatedHash) {
        errors.push({
          index: i,
          type: 'HASH_MISMATCH',
          message: `Block ${i} hash integrity compromised! Expected '${calculatedHash}', got '${tx.hash}'`,
          details: { calculatedHash, storedHash: tx.hash },
        });
      }

      // 4. Verify running balance computation
      runningBalance = Number((runningBalance + tx.amount).toFixed(6));
      if (Math.abs(tx.balance - runningBalance) > 0.000001) {
        errors.push({
          index: i,
          type: 'BALANCE_MISMATCH',
          message: `Block ${i} balance discrepancy. Calculated: $${runningBalance}, recorded: $${tx.balance}`,
          details: { calculatedBalance: runningBalance, recordedBalance: tx.balance },
        });
      }

      expectedPrevHash = tx.hash;
    }

    const latestTx = transactions[transactions.length - 1];

    return {
      valid: errors.length === 0,
      totalTransactions: transactions.length,
      genesisHash: transactions[0].hash,
      latestHash: latestTx.hash,
      finalBalance: latestTx.balance,
      expectedBalance: runningBalance,
      errors,
    };
  }

  /**
   * Writes quick-access state cache.
   */
  private writeStateCache(
    balance: number,
    totalSpent: number,
    totalCredited: number,
    count: number
  ): void {
    const state = {
      balance,
      totalSpent,
      totalCredited,
      transactionCount: count,
      updatedAt: new Date().toISOString(),
    };
    try {
      fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2), 'utf8');
    } catch {
      // Non-fatal if state cache write fails
    }
  }

  /**
   * Exports ledger contents in JSON, CSV, or Markdown format.
   */
  public export(format: 'json' | 'csv' | 'markdown' = 'json'): string {
    const transactions = this.readAllTransactionsSync();

    switch (format) {
      case 'json':
        return JSON.stringify(transactions, null, 2);

      case 'csv': {
        const headers = [
          'index',
          'timestamp',
          'type',
          'amount',
          'balance',
          'currency',
          'model',
          'promptTokens',
          'completionTokens',
          'cachedTokens',
          'cost',
          'description',
          'agentId',
          'hash',
        ];

        const rows = transactions.map((t) => [
          t.index,
          `"${t.timestamp}"`,
          t.type,
          t.amount,
          t.balance,
          t.currency,
          `"${t.model ?? ''}"`,
          t.tokens?.promptTokens ?? 0,
          t.tokens?.completionTokens ?? 0,
          t.tokens?.cachedPromptTokens ?? 0,
          t.cost ?? 0,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.agentId ?? ''}"`,
          t.hash,
        ]);

        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      case 'markdown': {
        const lines: string[] = [];
        lines.push('# Agent Runway Transaction Ledger');
        lines.push('');
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push('');
        lines.push(
          '| Index | Timestamp | Type | Amount | Balance | Model | Tokens | Hash (SHA-256 Prefix) | Description |'
        );
        lines.push(
          '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
        );

        for (const t of transactions) {
          const sign = t.amount >= 0 ? '+' : '';
          const amtStr = `${sign}$${t.amount.toFixed(4)}`;
          const balStr = `$${t.balance.toFixed(4)}`;
          const modelStr = t.model ?? '-';
          const tokensStr = t.tokens ? `${t.tokens.totalTokens}` : '-';
          const hashShort = t.hash.substring(0, 10) + '...';

          lines.push(
            `| ${t.index} | ${t.timestamp} | ${t.type} | ${amtStr} | ${balStr} | ${modelStr} | ${tokensStr} | \`${hashShort}\` | ${t.description} |`
          );
        }

        return lines.join('\n');
      }
    }
  }
}
