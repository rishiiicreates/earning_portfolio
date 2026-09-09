import type { ModelPricing, TokenUsage } from './types.js';
/**
 * Built-in pricing tables for major AI model providers (USD per 1,000,000 tokens).
 */
export declare const DEFAULT_MODEL_PRICING: Record<string, ModelPricing>;
export declare class PricingRegistry {
    private customPricing;
    constructor();
    /**
     * Registers or overrides pricing for a model.
     */
    register(pricing: ModelPricing): void;
    /**
     * Resolves pricing for a given model string.
     */
    get(modelName: string): ModelPricing;
    /**
     * Returns all available model pricing configurations.
     */
    getAll(): ModelPricing[];
    /**
     * Computes the USD cost of a token usage payload for a specific model.
     */
    calculateCost(modelName: string, tokens: Partial<TokenUsage>): number;
    /**
     * Suggests lightweight fallback models if the current model is high cost.
     */
    getFallbackModel(modelName: string): string[];
    private normalizeModelName;
}
export declare const defaultPricingRegistry: PricingRegistry;
//# sourceMappingURL=pricing.d.ts.map