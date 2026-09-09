import EventEmitter from 'node:events';
import type { RunwayConfig, RunwayStatus, Transaction, DebitOptions, CreditOptions, InitOptions, VerificationResult } from './types.js';
import { Ledger } from './ledger.js';
import { PricingRegistry } from './pricing.js';
import { RunwayGuard } from './guard.js';
export declare class AgentRunway extends EventEmitter {
    readonly runwayDir: string;
    readonly ledger: Ledger;
    readonly pricing: PricingRegistry;
    private _guard;
    constructor(runwayDir?: string, pricing?: PricingRegistry);
    /**
     * Lazily loads or initializes the guard based on ledger config.
     */
    get guard(): RunwayGuard;
    /**
     * Initializes runway ledger and configuration.
     */
    init(options?: InitOptions): Promise<RunwayConfig>;
    /**
     * Checks if runway ledger is initialized.
     */
    isInitialized(): boolean;
    /**
     * Non-throwing pre-flight check. Returns true if agent has sufficient runway
     * to incur the estimated cost without breaching the kill threshold.
     */
    canExecute(estimatedCost?: number): boolean;
    /**
     * Throwing pre-flight assertion. Throws `RunwayExhaustedError` if execution
     * would breach safety threshold.
     */
    assertCanExecute(estimatedCost?: number): void;
    /**
     * Debits the runway ledger for token consumption or monetary cost.
     * Autonomous kill-switch triggers if balance drops below threshold.
     */
    debit(options: DebitOptions): Promise<Transaction>;
    /**
     * Credits the runway ledger (e.g. bounty rewards, budget top-ups).
     * Automatically disarms the killswitch if balance recovers.
     */
    credit(options: CreditOptions): Promise<Transaction>;
    /**
     * Calculates real-time runway status, burn velocity, and time remaining.
     */
    getStatus(): RunwayStatus;
    /**
     * Cryptographically verifies the append-only ledger.
     */
    verify(): VerificationResult;
    /**
     * Exports ledger to JSON, CSV, or Markdown.
     */
    export(format?: 'json' | 'csv' | 'markdown'): string;
    /**
     * Disarms the killswitch manually.
     */
    disarmKillSwitch(): boolean;
    /**
     * Wraps an arbitrary asynchronous tool execution with automated debiting
     * and runway safety assertions.
     */
    wrapTool<TArgs, TReturn>(toolName: string, fn: (args: TArgs) => Promise<TReturn>, options?: {
        estimatedCost?: number;
        model?: string;
        agentId?: string;
    }): (args: TArgs) => Promise<TReturn>;
    private calculateBurnRate;
    private calculateRunwayRemaining;
}
//# sourceMappingURL=runway.d.ts.map