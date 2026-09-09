import type { AgentRunway } from '../core/runway.js';
import type { TokenUsage } from '../core/types.js';
export interface AnthropicWrapOptions {
    agentId?: string;
    preflightCostEstimate?: number;
    onUsageTracked?: (tokens: TokenUsage, cost: number) => void;
}
/**
 * Wraps an Anthropic Claude SDK client to automatically intercept message completions,
 * capture prompt caching metrics, and record debits against the runway ledger.
 */
export declare function wrapAnthropic<T extends {
    messages?: {
        create?: Function;
    };
}>(anthropic: T, runway: AgentRunway, options?: AnthropicWrapOptions): T;
//# sourceMappingURL=anthropic.d.ts.map