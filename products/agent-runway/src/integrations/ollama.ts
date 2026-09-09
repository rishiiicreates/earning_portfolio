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
export function wrapOllama<T extends { chat?: Function; generate?: Function }>(
  ollama: T,
  runway: AgentRunway,
  options: OllamaWrapOptions = {}
): T {
  const wrapMethod = (originalMethod: Function) => {
    return async function (
      this: any,
      params: { model: string; stream?: boolean; [key: string]: unknown },
      ...rest: unknown[]
    ) {
      const result = await originalMethod.call(this, params, ...rest);

      if (params.stream) {
        return result;
      }

      if (result && typeof result === 'object') {
        const promptTokens = (result as { prompt_eval_count?: number }).prompt_eval_count ?? 0;
        const completionTokens = (result as { eval_count?: number }).eval_count ?? 0;

        const tokens: TokenUsage = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        };

        // Extract tool call if present
        let toolName: string | undefined;
        const message = (result as { message?: { tool_calls?: Array<{ function?: { name?: string } }> } }).message;
        if (message?.tool_calls && message.tool_calls.length > 0) {
          toolName = message.tool_calls[0]?.function?.name;
        }

        // Calculate cost if custom compute rates were provided, else $0.00
        let cost = 0;
        if (options.costPer1MPrompt || options.costPer1MCompletion) {
          const pRate = options.costPer1MPrompt ?? 0;
          const cRate = options.costPer1MCompletion ?? 0;
          cost = (promptTokens / 1_000_000) * pRate + (completionTokens / 1_000_000) * cRate;
        }

        const tx = await runway.debit({
          amount: cost,
          model: params.model,
          tokens,
          agentId: options.agentId,
          toolCall: toolName ? { name: toolName } : undefined,
          description: `Ollama local inference: ${params.model}${toolName ? ` [tool: ${toolName}]` : ''}`,
        });

        if (options.onUsageTracked && tx.cost !== undefined) {
          options.onUsageTracked(tokens, tx.cost);
        }
      }

      return result;
    };
  };

  if (typeof ollama?.chat === 'function') {
    ollama.chat = wrapMethod(ollama.chat);
  }
  if (typeof ollama?.generate === 'function') {
    ollama.generate = wrapMethod(ollama.generate);
  }

  return ollama;
}
