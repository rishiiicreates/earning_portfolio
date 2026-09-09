/**
 * High-level tool interceptor that monitors individual tool calls,
 * enforces safety guard assertions, and logs debits with tool execution metadata.
 */
export async function trackToolExecution(runway, toolName, args, fn, options = {}) {
    const estimatedCost = options.estimatedCost ?? 0.001;
    runway.assertCanExecute(estimatedCost);
    const startTime = Date.now();
    const toolCall = {
        name: toolName,
        parametersSummary: options.extractParametersSummary
            ? options.extractParametersSummary(args)
            : typeof args === 'object' && args !== null
                ? Object.keys(args).slice(0, 5).join(', ')
                : undefined,
    };
    try {
        const result = await fn();
        const durationMs = Date.now() - startTime;
        await runway.debit({
            amount: estimatedCost,
            description: `Tool call executed: ${toolName} (${durationMs}ms)`,
            toolCall,
            agentId: options.agentId,
            metadata: {
                durationMs,
                success: true,
            },
        }).catch(() => {
            // Avoid unhandled rejection if background flush fails
        });
        return result;
    }
    catch (err) {
        const durationMs = Date.now() - startTime;
        await runway.debit({
            amount: estimatedCost,
            description: `Tool call failed: ${toolName} (${durationMs}ms)`,
            toolCall,
            agentId: options.agentId,
            metadata: {
                durationMs,
                success: false,
                error: err instanceof Error ? err.message : String(err),
            },
        }).catch(() => { });
        throw err;
    }
}
//# sourceMappingURL=tool-interceptor.js.map