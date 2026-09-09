import type { AgentRunway } from '../core/runway.js';
import type { TokenUsage } from '../core/types.js';
export interface GeminiWrapOptions {
    modelName?: string;
    agentId?: string;
    preflightCostEstimate?: number;
    onUsageTracked?: (tokens: TokenUsage, cost: number) => void;
}
/**
 * Wraps a Google Gemini GenerativeModel or GenAI client instance to intercept
 * content generation calls, measure usageMetadata, and debit the runway ledger.
 */
export declare function wrapGemini<T extends {
    generateContent?: Function;
    model?: string;
}>(geminiModel: T, runway: AgentRunway, options?: GeminiWrapOptions): T;
//# sourceMappingURL=gemini.d.ts.map