/**
 * Wraps an Anthropic Claude SDK client to automatically intercept message completions,
 * capture prompt caching metrics, and record debits against the runway ledger.
 */
export function wrapAnthropic(anthropic, runway, options = {}) {
    if (!anthropic?.messages?.create) {
        return anthropic;
    }
    const originalCreate = anthropic.messages.create.bind(anthropic.messages);
    anthropic.messages.create = async function (params, ...rest) {
        // 1. Pre-flight runway guard assertion
        const estimatedCost = options.preflightCostEstimate ?? 0.003;
        runway.assertCanExecute(estimatedCost);
        // 2. Invoke original Anthropic create
        const result = await originalCreate(params, ...rest);
        if (params.stream) {
            return result;
        }
        // 3. Extract token metrics from Anthropic Claude response
        if (result && typeof result === 'object' && 'usage' in result && result.usage) {
            const usage = result.usage;
            const tokens = {
                promptTokens: usage.input_tokens ?? 0,
                completionTokens: usage.output_tokens ?? 0,
                cachedPromptTokens: usage.cache_read_input_tokens ?? 0,
                cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
                totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
            };
            // Extract tool call if present in content blocks
            let toolName;
            const content = result.content;
            if (Array.isArray(content)) {
                const toolBlock = content.find((c) => c.type === 'tool_use');
                if (toolBlock?.name) {
                    toolName = toolBlock.name;
                }
            }
            const tx = await runway.debit({
                model: params.model,
                tokens,
                agentId: options.agentId,
                toolCall: toolName ? { name: toolName } : undefined,
                description: `Anthropic ${params.model} inference${toolName ? ` [tool: ${toolName}]` : ''}`,
            });
            if (options.onUsageTracked && tx.cost !== undefined) {
                options.onUsageTracked(tokens, tx.cost);
            }
        }
        return result;
    };
    return anthropic;
}
//# sourceMappingURL=anthropic.js.map