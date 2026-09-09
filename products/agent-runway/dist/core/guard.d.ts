import type { RunwayHealthState, ThrottleAdvice } from './types.js';
export interface GuardOptions {
    runwayDir: string;
    killThreshold: number;
    warnThreshold: number;
    agentName: string;
}
export declare class RunwayGuard {
    private runwayDir;
    private killThreshold;
    private warnThreshold;
    private agentName;
    private killSwitchPath;
    constructor(options: GuardOptions);
    /**
     * Returns whether the physical kill-switch sentinel file exists.
     */
    isKillSwitchActive(): boolean;
    /**
     * Retrieves the absolute path to the KILLSWITCH sentinel file.
     */
    getKillSwitchPath(): string;
    /**
     * Arm / trigger the physical kill-switch sentinel file.
     */
    armKillSwitch(currentBalance: number, reason: string): void;
    /**
     * Disarms and removes the kill-switch sentinel file (e.g. upon fund credit/topup).
     */
    disarmKillSwitch(): boolean;
    /**
     * Evaluates the current health state of the agent runway.
     */
    evaluateState(currentBalance: number): RunwayHealthState;
    /**
     * Pre-flight guard assertion. Throws `RunwayExhaustedError` and arms sentinel
     * if execution is prohibited or funds would be depleted beyond kill threshold.
     */
    assertExecutionPermitted(currentBalance: number, estimatedCost?: number): void;
    /**
     * Generates actionable throttling advice when the balance falls into the warning zone.
     */
    getThrottleAdvice(currentBalance: number, currentModel?: string): ThrottleAdvice | undefined;
}
//# sourceMappingURL=guard.d.ts.map