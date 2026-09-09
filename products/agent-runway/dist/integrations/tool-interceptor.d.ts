import type { AgentRunway } from '../core/runway.js';
export interface ToolTrackingOptions {
    estimatedCost?: number;
    model?: string;
    agentId?: string;
    extractParametersSummary?: (args: unknown) => string;
}
/**
 * High-level tool interceptor that monitors individual tool calls,
 * enforces safety guard assertions, and logs debits with tool execution metadata.
 */
export declare function trackToolExecution<T>(runway: AgentRunway, toolName: string, args: unknown, fn: () => Promise<T>, options?: ToolTrackingOptions): Promise<T>;
//# sourceMappingURL=tool-interceptor.d.ts.map