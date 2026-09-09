import type { Transaction, TransactionType, RunwayConfig, VerificationResult, InitOptions } from './types.js';
export declare class Ledger {
    readonly runwayDir: string;
    readonly ledgerPath: string;
    readonly configPath: string;
    readonly statePath: string;
    readonly lockPath: string;
    constructor(runwayDir?: string);
    /**
     * Checks if the runway ledger is initialized.
     */
    isInitialized(): boolean;
    /**
     * Initializes a new runway ledger with a genesis budget transaction.
     */
    initialize(options?: InitOptions): Promise<RunwayConfig>;
    /**
     * Reads and parses runway configuration.
     */
    getConfig(): RunwayConfig;
    /**
     * Appends a new transaction atomically with strict cryptographic hash chaining.
     */
    recordTransaction(entry: {
        type: TransactionType;
        amount: number;
        description: string;
        model?: string;
        tokens?: Transaction['tokens'];
        cost?: number;
        agentId?: string;
        toolCall?: Transaction['toolCall'];
        metadata?: Record<string, unknown>;
    }): Promise<Transaction>;
    /**
     * Reads all transactions synchronously.
     */
    readAllTransactionsSync(): Transaction[];
    /**
     * Retrieves the latest transaction and current balance.
     */
    getLatestTransaction(): Transaction | null;
    /**
     * Performs an exhaustive cryptographic and accounting audit of the ledger.
     */
    verifyLedger(): VerificationResult;
    /**
     * Writes quick-access state cache.
     */
    private writeStateCache;
    /**
     * Exports ledger contents in JSON, CSV, or Markdown format.
     */
    export(format?: 'json' | 'csv' | 'markdown'): string;
}
//# sourceMappingURL=ledger.d.ts.map