import type { AgentRunway } from '../core/runway.js';
import type { TokenUsage } from '../core/types.js';
export interface OllamaWrapOptions {
    agentId?: string;
    costPer1MPrompt?: number;
    costPer1MCompletion?: number;
    onUsageTracked?: (tokens: TokenUsage, cost: number) => void;
}
/**
 * Wraps an Ollama client instance to track local model inference tokens,
 * tool calls, and record compute operations into the runway ledger.
 */
export declare function wrapOllama<T extends {
    chat?: Function;
    generate?: Function;
}>(ollama: T, runway: AgentRunway, options?: OllamaWrapOptions): T;
//# sourceMappingURL=ollama.d.ts.map