import { describe, it, expect } from 'vitest';
import { PricingRegistry, defaultPricingRegistry } from '../../src/core/pricing.js';
import { ModelPricingNotFoundError } from '../../src/core/errors.js';

describe('Pricing Registry', () => {
  it('should have default pricing for major providers', () => {
    const all = defaultPricingRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(15);

    const gpt4o = defaultPricingRegistry.get('gpt-4o');
    expect(gpt4o.provider).toBe('openai');
    expect(gpt4o.promptCostPer1M).toBe(2.5);
    expect(gpt4o.completionCostPer1M).toBe(10.0);

    const sonnet = defaultPricingRegistry.get('claude-3-5-sonnet');
    expect(sonnet.provider).toBe('anthropic');
    expect(sonnet.promptCostPer1M).toBe(3.0);
    expect(sonnet.completionCostPer1M).toBe(15.0);

    const flash = defaultPricingRegistry.get('gemini-1.5-flash');
    expect(flash.provider).toBe('gemini');
    expect(flash.promptCostPer1M).toBe(0.075);
  });

  it('should calculate cost correctly for standard tokens', () => {
    // gpt-4o: $2.50 / 1M prompt, $10.00 / 1M completion
    // 100,000 prompt = $0.25, 50,000 completion = $0.50 -> total $0.75
    const cost = defaultPricingRegistry.calculateCost('gpt-4o', {
      promptTokens: 100_000,
      completionTokens: 50_000,
    });
    expect(cost).toBe(0.75);
  });

  it('should calculate cost with prompt caching discounts', () => {
    // claude-3-5-sonnet: $3.00 / 1M prompt, $0.30 / 1M cached read, $15.00 / 1M completion
    // 100,000 prompt tokens total, of which 80,000 cached read:
    // effective prompt = 20,000 * $3 / 1M = $0.06
    // cached prompt = 80,000 * $0.30 / 1M = $0.024
    // completion = 10,000 * $15 / 1M = $0.15
    // total = $0.234
    const cost = defaultPricingRegistry.calculateCost('claude-3-5-sonnet', {
      promptTokens: 100_000,
      cachedPromptTokens: 80_000,
      completionTokens: 10_000,
    });
    expect(cost).toBeCloseTo(0.234, 4);
  });

  it('should account for cache creation cost if applicable', () => {
    const cost = defaultPricingRegistry.calculateCost('claude-3-5-sonnet', {
      promptTokens: 10_000,
      cacheCreationTokens: 5_000,
      completionTokens: 0,
    });
    // prompt: 10000 * 3 / 1M = 0.03
    // creation: 5000 * 3.75 / 1M = 0.01875
    // total = 0.04875
    expect(cost).toBeCloseTo(0.04875, 4);
  });

  it('should resolve local/ollama models as zero cost', () => {
    const ollamaPricing = defaultPricingRegistry.get('llama3.2');
    expect(ollamaPricing.provider).toBe('ollama');
    expect(ollamaPricing.promptCostPer1M).toBe(0);

    const cost = defaultPricingRegistry.calculateCost('deepseek-r1:8b', {
      promptTokens: 500_000,
      completionTokens: 200_000,
    });
    expect(cost).toBe(0);
  });

  it('should support custom model registration', () => {
    const registry = new PricingRegistry();
    registry.register({
      provider: 'custom',
      model: 'my-finetuned-llama',
      promptCostPer1M: 0.5,
      completionCostPer1M: 1.0,
    });

    const cost = registry.calculateCost('my-finetuned-llama', {
      promptTokens: 1_000_000,
      completionTokens: 500_000,
    });
    expect(cost).toBe(1.0);
  });

  it('should throw ModelPricingNotFoundError for unknown proprietary models', () => {
    expect(() => defaultPricingRegistry.get('unknown-secret-model-xyz')).toThrow(
      ModelPricingNotFoundError
    );
  });

  it('should provide fallback suggestions for expensive models', () => {
    const sonnetFallbacks = defaultPricingRegistry.getFallbackModel('claude-3-5-sonnet');
    expect(sonnetFallbacks).toContain('claude-3-5-haiku');

    const gptFallbacks = defaultPricingRegistry.getFallbackModel('gpt-4o');
    expect(gptFallbacks).toContain('gpt-4o-mini');

    const geminiFallbacks = defaultPricingRegistry.getFallbackModel('gemini-1.5-pro');
    expect(geminiFallbacks).toContain('gemini-1.5-flash');
  });
});
