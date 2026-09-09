/**
 * Wraps a Google Gemini GenerativeModel or GenAI client instance to intercept
 * content generation calls, measure usageMetadata, and debit the runway ledger.
 */
export function wrapGemini(geminiModel, runway, options = {}) {
    if (!geminiModel?.generateContent) {
        return geminiModel;
    }
    const originalGenerateContent = geminiModel.generateContent.bind(geminiModel);
    const resolvedModelName = options.modelName ??
        geminiModel.model ??
        'gemini-1.5-flash';
    geminiModel.generateContent = async function (request, ...rest) {
        // 1. Pre-flight guard assertion
        const estimatedCost = options.preflightCostEstimate ?? 0.001;
        runway.assertCanExecute(estimatedCost);
        // 2. Execute original Gemini call
        const result = await originalGenerateContent(request, ...rest);
        // 3. Extract usageMetadata
        const response = (result && typeof result === 'object' && 'response' in result)
            ? result.response
            : result;
        if (response && typeof response === 'object' && 'usageMetadata' in response) {
            const usage = response.usageMetadata;
            if (usage) {
                const tokens = {
                    promptTokens: usage.promptTokenCount ?? 0,
                    completionTokens: usage.candidatesTokenCount ?? 0,
                    cachedPromptTokens: usage.cachedContentTokenCount ?? 0,
                    totalTokens: usage.totalTokenCount ??
                        (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0),
                };
                // Extract function / tool call name if present
                let toolName;
                if (typeof response.functionCalls === 'function') {
                    const fnCalls = response.functionCalls();
                    if (Array.isArray(fnCalls) && fnCalls.length > 0) {
                        toolName = fnCalls[0]?.name;
                    }
                }
                const tx = await runway.debit({
                    model: resolvedModelName,
                    tokens,
                    agentId: options.agentId,
                    toolCall: toolName ? { name: toolName } : undefined,
                    description: `Gemini ${resolvedModelName} inference${toolName ? ` [tool: ${toolName}]` : ''}`,
                });
                if (options.onUsageTracked && tx.cost !== undefined) {
                    options.onUsageTracked(tokens, tx.cost);
                }
            }
        }
        return result;
    };
    return geminiModel;
}
//# sourceMappingURL=gemini.js.map