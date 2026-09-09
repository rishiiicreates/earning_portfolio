import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatTokens,
  formatDuration,
  formatStatusDashboard,
  formatVerificationReport,
  formatPricingTable,
} from '../../src/utils/format.js';
import type { RunwayStatus, VerificationResult, ModelPricing } from '../../src/core/types.js';

describe('Format Utilities', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(12.34567, 'USD')).toBe('$12.3457 USD');
    expect(formatCurrency(-5.2, 'EUR')).toBe('-$5.2000 EUR');
  });

  it('should format token counts', () => {
    expect(formatTokens(1234567)).toBe('1,234,567');
    expect(formatTokens(0)).toBe('0');
  });

  it('should format duration', () => {
    expect(formatDuration(null)).toBe('N/A (no burn)');
    expect(formatDuration(0.5)).toBe('< 1 min');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('should format status dashboard', () => {
    const status: RunwayStatus = {
      agentName: 'scout-agent',
      currency: 'USD',
      initialBudget: 100.0,
      currentBalance: 75.5,
      totalSpent: 24.5,
      totalCredited: 100.0,
      burnRate: {
        perMinute: 0.05,
        perHour: 3.0,
        tokensPerMinute: 1200,
      },
      runwayRemaining: {
        estimatedMinutes: 1510,
        estimatedHours: 25.2,
        estimatedTasks: 150,
      },
      tokens: {
        totalPrompt: 50000,
        totalCompletion: 12000,
        totalCached: 8000,
        totalAll: 62000,
      },
      transactionCount: 5,
      state: 'HEALTHY',
      killSwitchActive: false,
    };

    const out = formatStatusDashboard(status);
    expect(out).toContain('AGENT RUNWAY MONITOR');
    expect(out).toContain('scout-agent');
    expect(out).toContain('75.5000');
    expect(out).toContain('1,200 tokens/min');
    expect(out).toContain('DISARMED');
  });

  it('should format dashboard with throttle advice and killswitch', () => {
    const throttledStatus: RunwayStatus = {
      agentName: 'throttled-agent',
      currency: 'USD',
      initialBudget: 10.0,
      currentBalance: 1.5,
      totalSpent: 8.5,
      totalCredited: 10.0,
      burnRate: { perMinute: 0.1, perHour: 6.0, tokensPerMinute: 500 },
      runwayRemaining: { estimatedMinutes: 15, estimatedHours: 0.3, estimatedTasks: 2 },
      tokens: { totalPrompt: 1000, totalCompletion: 500, totalCached: 0, totalAll: 1500 },
      transactionCount: 8,
      state: 'THROTTLED',
      killSwitchActive: false,
      throttleAdvice: {
        message: 'Balance critical',
        suggestedFallbackModels: ['gpt-4o-mini'],
        rateLimitDelayMs: 1500,
        reductionPercentage: 70,
      },
    };

    const out = formatStatusDashboard(throttledStatus);
    expect(out).toContain('THROTTLE DIRECTIVE ACTIVE');
    expect(out).toContain('gpt-4o-mini');
  });

  it('should format verification report for passed audit', () => {
    const passedAudit: VerificationResult = {
      valid: true,
      totalTransactions: 10,
      genesisHash: 'abc1234567890abcdef1234567890abcdef',
      latestHash: 'def1234567890abcdef1234567890abcdef',
      finalBalance: 40.0,
      expectedBalance: 40.0,
      errors: [],
    };

    const out = formatVerificationReport(passedAudit);
    expect(out).toContain('AUDIT PASSED');
  });

  it('should format verification report for failed audit', () => {
    const failedAudit: VerificationResult = {
      valid: false,
      totalTransactions: 3,
      genesisHash: 'abc1234567890abcdef1234567890abcdef',
      latestHash: 'def1234567890abcdef1234567890abcdef',
      finalBalance: 10.0,
      expectedBalance: 5.0,
      errors: [
        {
          index: 2,
          type: 'BALANCE_MISMATCH',
          message: 'Mismatch at block 2',
        },
      ],
    };

    const out = formatVerificationReport(failedAudit);
    expect(out).toContain('AUDIT FAILED');
    expect(out).toContain('BALANCE_MISMATCH');
  });

  it('should format pricing table', () => {
    const pricing: ModelPricing[] = [
      {
        provider: 'openai',
        model: 'gpt-4o',
        promptCostPer1M: 2.5,
        completionCostPer1M: 10.0,
        cachedPromptCostPer1M: 1.25,
      },
    ];

    const out = formatPricingTable(pricing);
    expect(out).toContain('MODEL PRICING REGISTRY');
    expect(out).toContain('gpt-4o');
    expect(out).toContain('$2.50');
  });
});
