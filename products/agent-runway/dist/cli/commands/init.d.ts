export interface InitCommandOptions {
    budget?: string;
    name?: string;
    currency?: string;
    killThreshold?: string;
    warnThreshold?: string;
    dir?: string;
    force?: boolean;
}
export declare function handleInit(options: InitCommandOptions): Promise<void>;
//# sourceMappingURL=init.d.ts.map