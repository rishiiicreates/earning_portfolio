export interface CreditCommandOptions {
    amount: string;
    desc?: string;
    agent?: string;
    dir?: string;
}
export declare function handleCredit(options: CreditCommandOptions): Promise<void>;
//# sourceMappingURL=credit.d.ts.map