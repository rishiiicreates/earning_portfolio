/**
 * Custom error hierarchy for agent-runway
 */
export declare class RunwayError extends Error {
    constructor(message: string);
}
export declare class RunwayExhaustedError extends RunwayError {
    readonly balance: number;
    readonly killThreshold: number;
    readonly attemptedCost?: number;
    constructor(balance: number, killThreshold: number, attemptedCost?: number);
}
export declare class RunwayThrottledError extends RunwayError {
    readonly balance: number;
    readonly warnThreshold: number;
    constructor(balance: number, warnThreshold: number);
}
export declare class LedgerCorruptedError extends RunwayError {
    readonly details: Record<string, unknown>;
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class LockAcquisitionError extends RunwayError {
    readonly lockPath: string;
    constructor(lockPath: string, timeoutMs: number);
}
export declare class ModelPricingNotFoundError extends RunwayError {
    readonly modelName: string;
    constructor(modelName: string);
}
export declare class RunwayNotInitializedError extends RunwayError {
    readonly dir: string;
    constructor(dir: string);
}
//# sourceMappingURL=errors.d.ts.map