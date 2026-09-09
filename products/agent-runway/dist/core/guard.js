import * as fs from 'node:fs';
import * as path from 'node:path';
import { RunwayExhaustedError } from './errors.js';
export class RunwayGuard {
    runwayDir;
    killThreshold;
    warnThreshold;
    agentName;
    killSwitchPath;
    constructor(options) {
        this.runwayDir = options.runwayDir;
        this.killThreshold = options.killThreshold;
        this.warnThreshold = options.warnThreshold;
        this.agentName = options.agentName;
        this.killSwitchPath = path.join(this.runwayDir, 'KILLSWITCH');
    }
    /**
     * Returns whether the physical kill-switch sentinel file exists.
     */
    isKillSwitchActive() {
        return fs.existsSync(this.killSwitchPath);
    }
    /**
     * Retrieves the absolute path to the KILLSWITCH sentinel file.
     */
    getKillSwitchPath() {
        return this.killSwitchPath;
    }
    /**
     * Arm / trigger the physical kill-switch sentinel file.
     */
    armKillSwitch(currentBalance, reason) {
        const payload = {
            triggeredAt: new Date().toISOString(),
            agentName: this.agentName,
            balance: currentBalance,
            killThreshold: this.killThreshold,
            reason,
            pid: process.pid,
        };
        fs.mkdirSync(this.runwayDir, { recursive: true });
        fs.writeFileSync(this.killSwitchPath, JSON.stringify(payload, null, 2), 'utf8');
    }
    /**
     * Disarms and removes the kill-switch sentinel file (e.g. upon fund credit/topup).
     */
    disarmKillSwitch() {
        if (this.isKillSwitchActive()) {
            try {
                fs.unlinkSync(this.killSwitchPath);
                return true;
            }
            catch {
                return false;
            }
        }
        return false;
    }
    /**
     * Evaluates the current health state of the agent runway.
     */
    evaluateState(currentBalance) {
        if (this.isKillSwitchActive() || currentBalance <= this.killThreshold) {
            return 'KILLSWITCH';
        }
        if (currentBalance <= this.warnThreshold) {
            return 'THROTTLED';
        }
        return 'HEALTHY';
    }
    /**
     * Pre-flight guard assertion. Throws `RunwayExhaustedError` and arms sentinel
     * if execution is prohibited or funds would be depleted beyond kill threshold.
     */
    assertExecutionPermitted(currentBalance, estimatedCost = 0) {
        if (this.isKillSwitchActive()) {
            throw new RunwayExhaustedError(currentBalance, this.killThreshold);
        }
        const projectedBalance = currentBalance - estimatedCost;
        if (projectedBalance <= this.killThreshold) {
            const reason = `Balance after estimated cost ($${estimatedCost.toFixed(4)}) would breach kill threshold ($${this.killThreshold.toFixed(4)})`;
            this.armKillSwitch(currentBalance, reason);
            throw new RunwayExhaustedError(currentBalance, this.killThreshold, estimatedCost);
        }
    }
    /**
     * Generates actionable throttling advice when the balance falls into the warning zone.
     */
    getThrottleAdvice(currentBalance, currentModel) {
        if (currentBalance > this.warnThreshold) {
            return undefined;
        }
        const ratio = Math.max(0, currentBalance / (this.warnThreshold || 1));
        const delayMs = Math.round((1 - ratio) * 2000); // Up to 2s throttle backoff
        const fallbackMap = {
            'claude-3-5-sonnet': ['claude-3-5-haiku', 'claude-3-haiku'],
            'gpt-4o': ['gpt-4o-mini', 'o3-mini'],
            'gemini-1.5-pro': ['gemini-1.5-flash', 'gemini-2.0-flash'],
        };
        const suggested = currentModel && fallbackMap[currentModel]
            ? fallbackMap[currentModel]
            : ['gpt-4o-mini', 'claude-3-5-haiku', 'gemini-1.5-flash'];
        return {
            message: `Remaining runway ($${currentBalance.toFixed(2)}) is below safety warning threshold ($${this.warnThreshold.toFixed(2)}). Throttle active.`,
            suggestedFallbackModels: suggested,
            rateLimitDelayMs: delayMs,
            reductionPercentage: Math.round((1 - ratio) * 100),
        };
    }
}
//# sourceMappingURL=guard.js.map