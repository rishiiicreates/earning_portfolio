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
export function wrapGemini<T extends { generateContent?: Function; model?: string }>(
  geminiModel: T,
  runway: AgentRunway,
  options: GeminiWrapOptions = {}
): T {
  if (!geminiModel?.generateContent) {
    return geminiModel;
  }

  const originalGenerateContent = geminiModel.generateContent.bind(geminiModel);
  const resolvedModelName =
    options.modelName ??
    geminiModel.model ??
    'gemini-1.5-flash';

  geminiModel.generateContent = async function (
    request: unknown,
    ...rest: unknown[]
  ) {
    // 1. Pre-flight guard assertion
    const estimatedCost = options.preflightCostEstimate ?? 0.001;
    runway.assertCanExecute(estimatedCost);

    // 2. Execute original Gemini call
    const result = await originalGenerateContent(request, ...rest);

    // 3. Extract usageMetadata
    const response = (result && typeof result === 'object' && 'response' in result)
      ? (result as { response: unknown }).response
      : result;

    if (response && typeof response === 'object' && 'usageMetadata' in response) {
      const usage = (response as {
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
          cachedContentTokenCount?: number;
        };
      }).usageMetadata;

      if (usage) {
        const tokens: TokenUsage = {
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          cachedPromptTokens: usage.cachedContentTokenCount ?? 0,
          totalTokens:
            usage.totalTokenCount ??
            (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0),
        };

        // Extract function / tool call name if present
        let toolName: string | undefined;
        if (typeof (response as { functionCalls?: Function }).functionCalls === 'function') {
          const fnCalls = (response as { functionCalls: () => Array<{ name?: string }> }).functionCalls();
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
