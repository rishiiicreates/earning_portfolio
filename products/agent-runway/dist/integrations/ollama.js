/**
 * Wraps an Ollama client instance to track local model inference tokens,
 * tool calls, and record compute operations into the runway ledger.
 */
export function wrapOllama(ollama, runway, options = {}) {
    const wrapMethod = (originalMethod) => {
        return async function (params, ...rest) {
            const result = await originalMethod.call(this, params, ...rest);
            if (params.stream) {
                return result;
            }
            if (result && typeof result === 'object') {
                const promptTokens = result.prompt_eval_count ?? 0;
                const completionTokens = result.eval_count ?? 0;
                const tokens = {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                };
                // Extract tool call if present
                let toolName;
                const message = result.message;
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
//# sourceMappingURL=ollama.js.map