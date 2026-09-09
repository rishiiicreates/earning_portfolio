import type { ModelPricing, TokenUsage } from './types.js';
import { ModelPricingNotFoundError } from './errors.js';

/**
 * Built-in pricing tables for major AI model providers (USD per 1,000,000 tokens).
 */
export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  // --- OpenAI Models ---
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    promptCostPer1M: 2.50,
    completionCostPer1M: 10.00,
    cachedPromptCostPer1M: 1.25,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    promptCostPer1M: 0.15,
    completionCostPer1M: 0.60,
    cachedPromptCostPer1M: 0.075,
  },
  'o1': {
    provider: 'openai',
    model: 'o1',
    promptCostPer1M: 15.00,
    completionCostPer1M: 60.00,
    cachedPromptCostPer1M: 7.50,
  },
  'o1-mini': {
    provider: 'openai',
    model: 'o1-mini',
    promptCostPer1M: 3.00,
    completionCostPer1M: 12.00,
    cachedPromptCostPer1M: 1.50,
  },
  'o3-mini': {
    provider: 'openai',
    model: 'o3-mini',
    promptCostPer1M: 1.10,
    completionCostPer1M: 4.40,
    cachedPromptCostPer1M: 0.55,
  },
  'gpt-4-turbo': {
    provider: 'openai',
    model: 'gpt-4-turbo',
    promptCostPer1M: 10.00,
    completionCostPer1M: 30.00,
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    promptCostPer1M: 0.50,
    completionCostPer1M: 1.50,
  },

  // --- Anthropic Claude Models ---
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    promptCostPer1M: 3.00,
    completionCostPer1M: 15.00,
    cachedPromptCostPer1M: 0.30,
    cacheCreationCostPer1M: 3.75,
  },
  'claude-3-5-haiku': {
    provider: 'anthropic',
    model: 'claude-3-5-haiku',
    promptCostPer1M: 0.80,
    completionCostPer1M: 4.00,
    cachedPromptCostPer1M: 0.08,
    cacheCreationCostPer1M: 1.00,
  },
  'claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus',
    promptCostPer1M: 15.00,
    completionCostPer1M: 75.00,
    cachedPromptCostPer1M: 1.50,
    cacheCreationCostPer1M: 18.75,
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku',
    promptCostPer1M: 0.25,
    completionCostPer1M: 1.25,
  },

  // --- Google Gemini Models ---
  'gemini-1.5-pro': {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    promptCostPer1M: 1.25,
    completionCostPer1M: 5.00,
    cachedPromptCostPer1M: 0.3125,
  },
  'gemini-1.5-flash': {
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    promptCostPer1M: 0.075,
    completionCostPer1M: 0.30,
    cachedPromptCostPer1M: 0.01875,
  },
  'gemini-1.5-flash-8b': {
    provider: 'gemini',
    model: 'gemini-1.5-flash-8b',
    promptCostPer1M: 0.0375,
    completionCostPer1M: 0.15,
  },
  'gemini-2.0-flash': {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    promptCostPer1M: 0.10,
    completionCostPer1M: 0.40,
  },
  'gemini-2.0-flash-exp': {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    promptCostPer1M: 0.0,
    completionCostPer1M: 0.0,
  },

  // --- Ollama / Local Models (Zero direct API charge) ---
  'ollama-default': {
    provider: 'ollama',
    model: 'ollama-default',
    promptCostPer1M: 0.0,
    completionCostPer1M: 0.0,
  },
};

export class PricingRegistry {
  private customPricing: Map<string, ModelPricing> = new Map();

  constructor() {
    for (const [key, val] of Object.entries(DEFAULT_MODEL_PRICING)) {
      this.customPricing.set(key.toLowerCase(), val);
    }
  }

  /**
   * Registers or overrides pricing for a model.
   */
  public register(pricing: ModelPricing): void {
    const key = this.normalizeModelName(pricing.model);
    this.customPricing.set(key, pricing);
  }

  /**
   * Resolves pricing for a given model string.
   */
  public get(modelName: string): ModelPricing {
    const normalized = this.normalizeModelName(modelName);

    // Direct match
    if (this.customPricing.has(normalized)) {
      return this.customPricing.get(normalized)!;
    }

    // Check for versioned matches (e.g. claude-3-5-sonnet-20241022 -> claude-3-5-sonnet)
    for (const [key, pricing] of this.customPricing.entries()) {
      if (normalized.startsWith(key) || key.startsWith(normalized)) {
        return pricing;
      }
    }

    // Ollama / local fallback: if prefixed with ollama/ or common local models
    if (
      normalized.startsWith('ollama') ||
      normalized.includes('llama') ||
      normalized.includes('mistral') ||
      normalized.includes('qwen') ||
      normalized.includes('phi') ||
      normalized.includes('deepseek')
    ) {
      return {
        provider: 'ollama',
        model: modelName,
        promptCostPer1M: 0.0,
        completionCostPer1M: 0.0,
      };
    }

    throw new ModelPricingNotFoundError(modelName);
  }

  /**
   * Returns all available model pricing configurations.
   */
  public getAll(): ModelPricing[] {
    return Array.from(this.customPricing.values());
  }

  /**
   * Computes the USD cost of a token usage payload for a specific model.
   */
  public calculateCost(
    modelName: string,
    tokens: Partial<TokenUsage>
  ): number {
    const pricing = this.get(modelName);

    const promptTokens = tokens.promptTokens ?? 0;
    const completionTokens = tokens.completionTokens ?? 0;
    const cachedTokens = tokens.cachedPromptTokens ?? 0;
    const cacheCreationTokens = tokens.cacheCreationTokens ?? 0;

    // Standard prompt tokens excluding cached portion if cached pricing exists
    let effectivePromptTokens = promptTokens;
    let cachedPromptCost = 0;

    if (cachedTokens > 0 && pricing.cachedPromptCostPer1M !== undefined) {
      effectivePromptTokens = Math.max(0, promptTokens - cachedTokens);
      cachedPromptCost = (cachedTokens / 1_000_000) * pricing.cachedPromptCostPer1M;
    }

    const promptCost = (effectivePromptTokens / 1_000_000) * pricing.promptCostPer1M;
    const completionCost = (completionTokens / 1_000_000) * pricing.completionCostPer1M;
    const cacheCreationCost =
      cacheCreationTokens > 0 && pricing.cacheCreationCostPer1M !== undefined
        ? (cacheCreationTokens / 1_000_000) * pricing.cacheCreationCostPer1M
        : 0;

    const totalCost = promptCost + completionCost + cachedPromptCost + cacheCreationCost;
    return Number(totalCost.toFixed(6));
  }

  /**
   * Suggests lightweight fallback models if the current model is high cost.
   */
  public getFallbackModel(modelName: string): string[] {
    const normalized = this.normalizeModelName(modelName);

    if (normalized.includes('sonnet') || normalized.includes('opus')) {
      return ['claude-3-5-haiku', 'claude-3-haiku'];
    }
    if (normalized.includes('gpt-4o') || normalized.includes('o1') || normalized.includes('gpt-4')) {
      return ['gpt-4o-mini', 'o3-mini'];
    }
    if (normalized.includes('gemini-1.5-pro')) {
      return ['gemini-1.5-flash', 'gemini-2.0-flash'];
    }

    return ['gpt-4o-mini', 'claude-3-5-haiku', 'gemini-1.5-flash'];
  }

  private normalizeModelName(model: string): string {
    return model
      .toLowerCase()
      .trim()
      .replace(/^(models\/|openai\/|anthropic\/|google\/)/, '')
      .replace(/:latest$/, '');
  }
}

export const defaultPricingRegistry = new PricingRegistry();
