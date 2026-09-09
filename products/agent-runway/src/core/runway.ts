import EventEmitter from 'node:events';
import type {
  RunwayConfig,
  RunwayStatus,
  Transaction,
  DebitOptions,
  CreditOptions,
  InitOptions,
  VerificationResult,
  AggregatedTokens,
  BurnRate,
  RunwayRemaining,
} from './types.js';
import { Ledger } from './ledger.js';
import { PricingRegistry, defaultPricingRegistry } from './pricing.js';
import { RunwayGuard } from './guard.js';
import { RunwayExhaustedError } from './errors.js';

export class AgentRunway extends EventEmitter {
  public readonly runwayDir: string;
  public readonly ledger: Ledger;
  public readonly pricing: PricingRegistry;
  private _guard: RunwayGuard | null = null;

  constructor(runwayDir: string = '.runway', pricing: PricingRegistry = defaultPricingRegistry) {
    super();
    this.runwayDir = runwayDir;
    this.ledger = new Ledger(runwayDir);
    this.pricing = pricing;
  }

  /**
   * Lazily loads or initializes the guard based on ledger config.
   */
  public get guard(): RunwayGuard {
    if (!this._guard) {
      const config = this.ledger.isInitialized()
        ? this.ledger.getConfig()
        : { agentName: 'autonomous-agent', killThreshold: 0.0, warnThreshold: 2.0 };

      this._guard = new RunwayGuard({
        runwayDir: this.runwayDir,
        killThreshold: config.killThreshold,
        warnThreshold: config.warnThreshold,
        agentName: config.agentName,
      });
    }
    return this._guard;
  }

  /**
   * Initializes runway ledger and configuration.
   */
  public async init(options: InitOptions = {}): Promise<RunwayConfig> {
    const config = await this.ledger.initialize(options);
    this._guard = new RunwayGuard({
      runwayDir: this.runwayDir,
      killThreshold: config.killThreshold,
      warnThreshold: config.warnThreshold,
      agentName: config.agentName,
    });
    return config;
  }

  /**
   * Checks if runway ledger is initialized.
   */
  public isInitialized(): boolean {
    return this.ledger.isInitialized();
  }

  /**
   * Non-throwing pre-flight check. Returns true if agent has sufficient runway
   * to incur the estimated cost without breaching the kill threshold.
   */
  public canExecute(estimatedCost: number = 0): boolean {
    if (!this.isInitialized()) return false;
    if (this.guard.isKillSwitchActive()) return false;

    const latest = this.ledger.getLatestTransaction();
    if (!latest) return false;

    return latest.balance - estimatedCost > this.guard['killThreshold'];
  }

  /**
   * Throwing pre-flight assertion. Throws `RunwayExhaustedError` if execution
   * would breach safety threshold.
   */
  public assertCanExecute(estimatedCost: number = 0): void {
    const latest = this.ledger.getLatestTransaction();
    const balance = latest ? latest.balance : 0;
    this.guard.assertExecutionPermitted(balance, estimatedCost);
  }

  /**
   * Debits the runway ledger for token consumption or monetary cost.
   * Autonomous kill-switch triggers if balance drops below threshold.
   */
  public async debit(options: DebitOptions): Promise<Transaction> {
    let cost = 0;

    if (options.amount !== undefined) {
      cost = Math.abs(options.amount);
    } else if (options.model && options.tokens) {
      cost = this.pricing.calculateCost(options.model, options.tokens);
    } else {
      throw new Error('Debit requires either explicit "amount" or "model" with "tokens".');
    }

    const latest = this.ledger.getLatestTransaction();
    const currentBalance = latest ? latest.balance : 0;

    // Check pre-flight guard
    try {
      this.guard.assertExecutionPermitted(currentBalance, cost);
    } catch (err) {
      if (err instanceof RunwayExhaustedError) {
        this.emit('killswitch', { balance: currentBalance, attemptedCost: cost, error: err });
      }
      throw err;
    }

    const description =
      options.description ??
      (options.model
        ? `Inference call: ${options.model} (${options.tokens?.totalTokens ?? 0} tokens)`
        : `Runway debit: $${cost.toFixed(4)}`);

    const tx = await this.ledger.recordTransaction({
      type: 'DEBIT',
      amount: -cost,
      description,
      model: options.model,
      tokens: options.tokens
        ? {
            promptTokens: options.tokens.promptTokens ?? 0,
            completionTokens: options.tokens.completionTokens ?? 0,
            cachedPromptTokens: options.tokens.cachedPromptTokens ?? 0,
            cacheCreationTokens: options.tokens.cacheCreationTokens ?? 0,
            totalTokens:
              (options.tokens.promptTokens ?? 0) + (options.tokens.completionTokens ?? 0),
          }
        : undefined,
      cost,
      agentId: options.agentId,
      toolCall: options.toolCall,
      metadata: options.metadata,
    });

    this.emit('debit', tx);

    // Post-transaction health check
    const state = this.guard.evaluateState(tx.balance);
    if (state === 'KILLSWITCH') {
      this.guard.armKillSwitch(tx.balance, `Balance depleted to $${tx.balance.toFixed(4)}`);
      this.emit('killswitch', { balance: tx.balance, tx });
      throw new RunwayExhaustedError(tx.balance, this.guard['killThreshold']);
    } else if (state === 'THROTTLED') {
      const advice = this.guard.getThrottleAdvice(tx.balance, options.model);
      this.emit('throttle', { balance: tx.balance, advice, tx });
    }

    return tx;
  }

  /**
   * Credits the runway ledger (e.g. bounty rewards, budget top-ups).
   * Automatically disarms the killswitch if balance recovers.
   */
  public async credit(options: CreditOptions): Promise<Transaction> {
    const amount = Math.abs(options.amount);
    const description = options.description ?? `Runway credit: +$${amount.toFixed(4)}`;

    const tx = await this.ledger.recordTransaction({
      type: 'CREDIT',
      amount,
      description,
      agentId: options.agentId,
      metadata: options.metadata,
    });

    // If killswitch was active and new balance is healthy, disarm it
    if (this.guard.isKillSwitchActive() && tx.balance > this.guard['killThreshold']) {
      this.guard.disarmKillSwitch();
    }

    this.emit('credit', tx);
    return tx;
  }

  /**
   * Calculates real-time runway status, burn velocity, and time remaining.
   */
  public getStatus(): RunwayStatus {
    const config = this.ledger.getConfig();
    const transactions = this.ledger.readAllTransactionsSync();

    if (transactions.length === 0) {
      throw new Error('Runway ledger contains no transactions.');
    }

    const latestTx = transactions[transactions.length - 1];
    const currentBalance = latestTx.balance;

    const debits = transactions.filter((t) => t.type === 'DEBIT');
    const credits = transactions.filter(
      (t) => t.type === 'CREDIT' || t.type === 'INITIAL_BUDGET'
    );

    const totalSpent = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCredited = credits.reduce((sum, t) => sum + t.amount, 0);

    // Aggregate tokens
    const tokens: AggregatedTokens = {
      totalPrompt: 0,
      totalCompletion: 0,
      totalCached: 0,
      totalAll: 0,
    };

    for (const t of transactions) {
      if (t.tokens) {
        tokens.totalPrompt += t.tokens.promptTokens ?? 0;
        tokens.totalCompletion += t.tokens.completionTokens ?? 0;
        tokens.totalCached += t.tokens.cachedPromptTokens ?? 0;
        tokens.totalAll += t.tokens.totalTokens ?? 0;
      }
    }

    // Burn rate calculation
    const burnRate = this.calculateBurnRate(transactions, debits);

    // Runway remaining projection
    const runwayRemaining = this.calculateRunwayRemaining(currentBalance, burnRate, debits);

    // Health state
    const state = this.guard.evaluateState(currentBalance);
    const killSwitchActive = this.guard.isKillSwitchActive();
    const throttleAdvice = this.guard.getThrottleAdvice(currentBalance);

    return {
      agentName: config.agentName,
      currency: config.currency,
      initialBudget: config.initialBudget,
      currentBalance: Number(currentBalance.toFixed(4)),
      totalSpent: Number(totalSpent.toFixed(4)),
      totalCredited: Number(totalCredited.toFixed(4)),
      burnRate,
      runwayRemaining,
      tokens,
      transactionCount: transactions.length,
      state,
      killSwitchActive,
      killSwitchPath: killSwitchActive ? this.guard.getKillSwitchPath() : undefined,
      throttleAdvice,
    };
  }

  /**
   * Cryptographically verifies the append-only ledger.
   */
  public verify(): VerificationResult {
    return this.ledger.verifyLedger();
  }

  /**
   * Exports ledger to JSON, CSV, or Markdown.
   */
  public export(format: 'json' | 'csv' | 'markdown' = 'json'): string {
    return this.ledger.export(format);
  }

  /**
   * Disarms the killswitch manually.
   */
  public disarmKillSwitch(): boolean {
    return this.guard.disarmKillSwitch();
  }

  /**
   * Wraps an arbitrary asynchronous tool execution with automated debiting
   * and runway safety assertions.
   */
  public wrapTool<TArgs, TReturn>(
    toolName: string,
    fn: (args: TArgs) => Promise<TReturn>,
    options?: {
      estimatedCost?: number;
      model?: string;
      agentId?: string;
    }
  ): (args: TArgs) => Promise<TReturn> {
    return async (args: TArgs): Promise<TReturn> => {
      const estimatedCost = options?.estimatedCost ?? 0.001;
      this.assertCanExecute(estimatedCost);

      const startTime = Date.now();
      try {
        const result = await fn(args);
        return result;
      } finally {
        const durationMs = Date.now() - startTime;
        // Optionally track tool call execution metadata
        if (options?.estimatedCost) {
          await this.debit({
            amount: options.estimatedCost,
            description: `Tool call: ${toolName} (${durationMs}ms)`,
            toolCall: { name: toolName },
            agentId: options.agentId,
          }).catch(() => {
            // Guard against unhandled rejections during background cleanup
          });
        }
      }
    };
  }

  private calculateBurnRate(allTxs: Transaction[], debits: Transaction[]): BurnRate {
    if (debits.length === 0 || allTxs.length < 2) {
      return { perMinute: 0, perHour: 0, tokensPerMinute: 0 };
    }

    const firstTime = new Date(allTxs[0].timestamp).getTime();
    const lastTime = new Date(allTxs[allTxs.length - 1].timestamp).getTime();
    const elapsedMinutes = Math.max((lastTime - firstTime) / (1000 * 60), 0.1);

    const totalSpent = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalTokens = debits.reduce((sum, t) => sum + (t.tokens?.totalTokens ?? 0), 0);

    const perMinute = Number((totalSpent / elapsedMinutes).toFixed(6));
    const perHour = Number((perMinute * 60).toFixed(4));
    const tokensPerMinute = Math.round(totalTokens / elapsedMinutes);

    return {
      perMinute,
      perHour,
      tokensPerMinute,
    };
  }

  private calculateRunwayRemaining(
    balance: number,
    burnRate: BurnRate,
    debits: Transaction[]
  ): RunwayRemaining {
    if (balance <= 0 || burnRate.perMinute <= 0) {
      return {
        estimatedMinutes: null,
        estimatedHours: null,
        estimatedTasks: null,
      };
    }

    const estimatedMinutes = Math.max(0, Math.round(balance / burnRate.perMinute));
    const estimatedHours = Number((estimatedMinutes / 60).toFixed(1));

    let estimatedTasks: number | null = null;
    if (debits.length > 0) {
      const avgDebit = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0) / debits.length;
      if (avgDebit > 0) {
        estimatedTasks = Math.floor(balance / avgDebit);
      }
    }

    return {
      estimatedMinutes,
      estimatedHours,
      estimatedTasks,
    };
  }
}
