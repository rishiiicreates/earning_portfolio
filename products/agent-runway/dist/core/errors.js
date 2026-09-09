/**
 * Custom error hierarchy for agent-runway
 */
export class RunwayError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RunwayError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class RunwayExhaustedError extends RunwayError {
    balance;
    killThreshold;
    attemptedCost;
    constructor(balance, killThreshold, attemptedCost) {
        const costNote = attemptedCost !== undefined ? ` (Attempted cost: $${attemptedCost.toFixed(6)})` : '';
        super(`Autonomous Kill-Switch Triggered: Runway balance ($${balance.toFixed(4)}) breached kill threshold ($${killThreshold.toFixed(4)})${costNote}. Agent execution halted.`);
        this.name = 'RunwayExhaustedError';
        this.balance = balance;
        this.killThreshold = killThreshold;
        this.attemptedCost = attemptedCost;
    }
}
export class RunwayThrottledError extends RunwayError {
    balance;
    warnThreshold;
    constructor(balance, warnThreshold) {
        super(`Runway Throttled: Balance ($${balance.toFixed(4)}) has fallen below warning threshold ($${warnThreshold.toFixed(4)}).`);
        this.name = 'RunwayThrottledError';
        this.balance = balance;
        this.warnThreshold = warnThreshold;
    }
}
export class LedgerCorruptedError extends RunwayError {
    details;
    constructor(message, details = {}) {
        super(`Ledger Integrity Violation: ${message}`);
        this.name = 'LedgerCorruptedError';
        this.details = details;
    }
}
export class LockAcquisitionError extends RunwayError {
    lockPath;
    constructor(lockPath, timeoutMs) {
        super(`Failed to acquire ledger lock at ${lockPath} after ${timeoutMs}ms.`);
        this.name = 'LockAcquisitionError';
        this.lockPath = lockPath;
    }
}
export class ModelPricingNotFoundError extends RunwayError {
    modelName;
    constructor(modelName) {
        super(`Model pricing not found for '${modelName}'. Please provide explicit prompt/completion token rates or cost.`);
        this.name = 'ModelPricingNotFoundError';
        this.modelName = modelName;
    }
}
export class RunwayNotInitializedError extends RunwayError {
    dir;
    constructor(dir) {
        super(`Runway is not initialized at '${dir}'. Run 'agent-runway init' first.`);
        this.name = 'RunwayNotInitializedError';
        this.dir = dir;
    }
}
//# sourceMappingURL=errors.js.map