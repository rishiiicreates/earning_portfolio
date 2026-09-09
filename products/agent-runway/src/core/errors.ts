/**
 * Custom error hierarchy for agent-runway
 */

export class RunwayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunwayError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RunwayExhaustedError extends RunwayError {
  public readonly balance: number;
  public readonly killThreshold: number;
  public readonly attemptedCost?: number;

  constructor(balance: number, killThreshold: number, attemptedCost?: number) {
    const costNote = attemptedCost !== undefined ? ` (Attempted cost: $${attemptedCost.toFixed(6)})` : '';
    super(
      `Autonomous Kill-Switch Triggered: Runway balance ($${balance.toFixed(4)}) breached kill threshold ($${killThreshold.toFixed(4)})${costNote}. Agent execution halted.`
    );
    this.name = 'RunwayExhaustedError';
    this.balance = balance;
    this.killThreshold = killThreshold;
    this.attemptedCost = attemptedCost;
  }
}

export class RunwayThrottledError extends RunwayError {
  public readonly balance: number;
  public readonly warnThreshold: number;

  constructor(balance: number, warnThreshold: number) {
    super(
      `Runway Throttled: Balance ($${balance.toFixed(4)}) has fallen below warning threshold ($${warnThreshold.toFixed(4)}).`
    );
    this.name = 'RunwayThrottledError';
    this.balance = balance;
    this.warnThreshold = warnThreshold;
  }
}

export class LedgerCorruptedError extends RunwayError {
  public readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(`Ledger Integrity Violation: ${message}`);
    this.name = 'LedgerCorruptedError';
    this.details = details;
  }
}

export class LockAcquisitionError extends RunwayError {
  public readonly lockPath: string;

  constructor(lockPath: string, timeoutMs: number) {
    super(`Failed to acquire ledger lock at ${lockPath} after ${timeoutMs}ms.`);
    this.name = 'LockAcquisitionError';
    this.lockPath = lockPath;
  }
}

export class ModelPricingNotFoundError extends RunwayError {
  public readonly modelName: string;

  constructor(modelName: string) {
    super(
      `Model pricing not found for '${modelName}'. Please provide explicit prompt/completion token rates or cost.`
    );
    this.name = 'ModelPricingNotFoundError';
    this.modelName = modelName;
  }
}

export class RunwayNotInitializedError extends RunwayError {
  public readonly dir: string;

  constructor(dir: string) {
    super(`Runway is not initialized at '${dir}'. Run 'agent-runway init' first.`);
    this.name = 'RunwayNotInitializedError';
    this.dir = dir;
  }
}
