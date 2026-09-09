import { createHash } from 'node:crypto';
export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * Computes a SHA-256 hexadecimal digest from string input.
 */
export function sha256(input) {
    return createHash('sha256').update(input, 'utf8').digest('hex');
}
/**
 * Generates a deterministic canonical string representation of a transaction
 * for hash calculation and audit verification.
 */
export function canonicalizeTransaction(tx) {
    const promptTokens = tx.tokens?.promptTokens ?? 0;
    const completionTokens = tx.tokens?.completionTokens ?? 0;
    const cachedTokens = tx.tokens?.cachedPromptTokens ?? 0;
    const model = tx.model ?? '';
    const cost = tx.cost !== undefined ? tx.cost.toFixed(6) : '0.000000';
    const toolName = tx.toolCall?.name ?? '';
    const agentId = tx.agentId ?? '';
    return [
        `idx=${tx.index}`,
        `ts=${tx.timestamp}`,
        `type=${tx.type}`,
        `amt=${tx.amount.toFixed(6)}`,
        `bal=${tx.balance.toFixed(6)}`,
        `curr=${tx.currency}`,
        `model=${model}`,
        `pt=${promptTokens}`,
        `ct=${completionTokens}`,
        `cached=${cachedTokens}`,
        `cost=${cost}`,
        `tool=${toolName}`,
        `agent=${agentId}`,
        `desc=${tx.description.trim()}`,
        `prev=${tx.prevHash}`,
    ].join('|');
}
/**
 * Computes the transaction hash given its fields and previous hash.
 */
export function computeTransactionHash(tx) {
    return sha256(canonicalizeTransaction(tx));
}
//# sourceMappingURL=crypto.js.map