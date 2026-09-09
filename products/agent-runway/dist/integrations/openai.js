/**
 * Wraps an OpenAI SDK client to automatically intercept chat completions,
 * extract token usage, and record cryptographic debits against the runway.
 */
export function wrapOpenAI(openai, runway, options = {}) {
    if (!openai?.chat?.completions?.create) {
        return openai;
    }
    const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
    openai.chat.completions.create = async function (params, ...rest) {
        // 1. Pre-flight guard assertion
        const estimatedCost = options.preflightCostEstimate ?? 0.002;
        runway.assertCanExecute(estimatedCost);
        // 2. Invoke original OpenAI create
        const result = await originalCreate(params, ...rest);
        // If streaming, return directly (or stream tracking if supported)
        if (params.stream) {
            return result;
        }
        // 3. Extract token usage from standard OpenAI response
        if (result && typeof result === 'object' && 'usage' in result && result.usage) {
            const usage = result.usage;
            const tokens = {
                promptTokens: usage.prompt_tokens ?? 0,
                completionTokens: usage.completion_tokens ?? 0,
                cachedPromptTokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
                totalTokens: usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
            };
            // Check if tool calls were returned
            let toolName;
            const choices = result.choices;
            if (choices && choices[0]?.message?.tool_calls && choices[0].message.tool_calls.length > 0) {
                toolName = choices[0].message.tool_calls[0]?.function?.name;
            }
            const tx = await runway.debit({
                model: params.model,
                tokens,
                agentId: options.agentId,
                toolCall: toolName ? { name: toolName } : undefined,
                description: `OpenAI ${params.model} inference${toolName ? ` [tool: ${toolName}]` : ''}`,
            });
            if (options.onUsageTracked && tx.cost !== undefined) {
                options.onUsageTracked(tokens, tx.cost);
            }
        }
        return result;
    };
    return openai;
}
//# sourceMappingURL=openai.js.map