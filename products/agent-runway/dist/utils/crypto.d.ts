import type { Transaction } from '../core/types.js';
export declare const GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
/**
 * Computes a SHA-256 hexadecimal digest from string input.
 */
export declare function sha256(input: string): string;
/**
 * Generates a deterministic canonical string representation of a transaction
 * for hash calculation and audit verification.
 */
export declare function canonicalizeTransaction(tx: Omit<Transaction, 'hash'>): string;
/**
 * Computes the transaction hash given its fields and previous hash.
 */
export declare function computeTransactionHash(tx: Omit<Transaction, 'hash'>): string;
//# sourceMappingURL=crypto.d.ts.map