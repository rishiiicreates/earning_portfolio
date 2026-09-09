export interface ExportCommandOptions {
    format?: 'json' | 'csv' | 'markdown';
    output?: string;
    dir?: string;
}
export declare function handleExport(options: ExportCommandOptions): Promise<void>;
//# sourceMappingURL=export.d.ts.map