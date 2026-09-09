/**
 * Type definitions for agent-runway
 * Autonomous runtime monitor, ledger auditor, and cost-efficiency toolkit for AI agents.
 */
export type TransactionType = 'INITIAL_BUDGET' | 'DEBIT' | 'CREDIT' | 'ADJUSTMENT' | 'REFUND';
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    cachedPromptTokens?: number;
    cacheCreationTokens?: number;
    totalTokens: number;
}
export interface ModelPricing {
    provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';
    model: string;
    promptCostPer1M: number;
    completionCostPer1M: number;
    cachedPromptCostPer1M?: number;
    cacheCreationCostPer1M?: number;
}
export interface ToolCallDetails {
    name: string;
    callId?: string;
    parametersSummary?: string;
}
export interface Transaction {
    index: number;
    timestamp: string;
    type: TransactionType;
    amount: number;
    balance: number;
    currency: string;
    model?: string;
    tokens?: TokenUsage;
    cost?: number;
    description: string;
    agentId?: string;
    toolCall?: ToolCallDetails;
    metadata?: Record<string, unknown>;
    prevHash: string;
    hash: string;
}
export interface RunwayConfig {
    version: string;
    agentName: string;
    initialBudget: number;
    currency: string;
    killThreshold: number;
    warnThreshold: number;
    createdAt: string;
    updatedAt: string;
}
export interface BurnRate {
    perMinute: number;
    perHour: number;
    tokensPerMinute: number;
}
export interface RunwayRemaining {
    estimatedMinutes: number | null;
    estimatedHours: number | null;
    estimatedTasks: number | null;
}
export interface AggregatedTokens {
    totalPrompt: number;
    totalCompletion: number;
    totalCached: number;
    totalAll: number;
}
export type RunwayHealthState = 'HEALTHY' | 'THROTTLED' | 'KILLSWITCH';
export interface ThrottleAdvice {
    message: string;
    suggestedFallbackModels: string[];
    rateLimitDelayMs: number;
    reductionPercentage: number;
}
export interface RunwayStatus {
    agentName: string;
    currency: string;
    initialBudget: number;
    currentBalance: number;
    totalSpent: number;
    totalCredited: number;
    burnRate: BurnRate;
    runwayRemaining: RunwayRemaining;
    tokens: AggregatedTokens;
    transactionCount: number;
    state: RunwayHealthState;
    killSwitchActive: boolean;
    killSwitchPath?: string;
    throttleAdvice?: ThrottleAdvice;
}
export interface VerificationError {
    index: number;
    type: 'HASH_MISMATCH' | 'PREV_HASH_MISMATCH' | 'BALANCE_MISMATCH' | 'CORRUPTED_ENTRY';
    message: string;
    details?: Record<string, unknown>;
}
export interface VerificationResult {
    valid: boolean;
    totalTransactions: number;
    genesisHash: string;
    latestHash: string;
    finalBalance: number;
    expectedBalance: number;
    errors: VerificationError[];
}
export interface DebitOptions {
    amount?: number;
    model?: string;
    tokens?: Partial<TokenUsage>;
    description?: string;
    agentId?: string;
    toolCall?: ToolCallDetails;
    metadata?: Record<string, unknown>;
}
export interface CreditOptions {
    amount: number;
    description?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
}
export interface InitOptions {
    budget?: number;
    name?: string;
    currency?: string;
    killThreshold?: number;
    warnThreshold?: number;
    dir?: string;
    overwrite?: boolean;
}
//# sourceMappingURL=types.d.ts.map