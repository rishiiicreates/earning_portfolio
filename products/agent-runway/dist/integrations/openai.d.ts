import type { AgentRunway } from '../core/runway.js';
import type { TokenUsage } from '../core/types.js';
export interface OpenAIWrapOptions {
    agentId?: string;
    preflightCostEstimate?: number;
    onUsageTracked?: (usage: TokenUsage, cost: number) => void;
}
/**
 * Wraps an OpenAI SDK client to automatically intercept chat completions,
 * extract token usage, and record cryptographic debits against the runway.
 */
export declare function wrapOpenAI<T extends {
    chat?: {
        completions?: {
            create?: Function;
        };
    };
}>(openai: T, runway: AgentRunway, options?: OpenAIWrapOptions): T;
//# sourceMappingURL=openai.d.ts.map