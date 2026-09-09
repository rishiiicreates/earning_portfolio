export interface DebitCommandOptions {
    amount?: string;
    tokens?: string;
    cached?: string;
    model?: string;
    desc?: string;
    agent?: string;
    tool?: string;
    dir?: string;
}
export declare function handleDebit(options: DebitCommandOptions): Promise<void>;
//# sourceMappingURL=debit.d.ts.map