import * as fs from 'node:fs';
import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
export async function handleExport(options) {
    const dir = options.dir ?? '.runway';
    const runway = new AgentRunway(dir);
    const format = options.format ?? 'json';
    try {
        const exported = runway.export(format);
        if (options.output) {
            fs.writeFileSync(options.output, exported, 'utf8');
            console.log(pc.green(`✔ Ledger exported to ${pc.bold(options.output)} (${format.toUpperCase()})`));
        }
        else {
            console.log(exported);
        }
    }
    catch (err) {
        console.error(pc.red(`Export failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
}
//# sourceMappingURL=export.js.map