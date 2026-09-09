import type { RunwayStatus, VerificationResult, ModelPricing } from '../core/types.js';
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function formatTokens(count: number): string;
export declare function formatDuration(minutes: number | null): string;
/**
 * Formats a terminal dashboard for `agent-runway status`.
 */
export declare function formatStatusDashboard(status: RunwayStatus): string;
/**
 * Formats cryptographic ledger verification output.
 */
export declare function formatVerificationReport(result: VerificationResult): string;
/**
 * Formats model pricing table.
 */
export declare function formatPricingTable(pricingList: ModelPricing[]): string;
//# sourceMappingURL=format.d.ts.map