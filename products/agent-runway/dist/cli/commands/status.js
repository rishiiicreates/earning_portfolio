import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
import { formatStatusDashboard } from '../../utils/format.js';
export async function handleStatus(options) {
    const dir = options.dir ?? '.runway';
    const runway = new AgentRunway(dir);
    const render = () => {
        try {
            const status = runway.getStatus();
            if (options.json) {
                console.log(JSON.stringify(status, null, 2));
            }
            else {
                if (options.watch) {
                    process.stdout.write('\x1Bc'); // Clear screen
                }
                console.log(formatStatusDashboard(status));
            }
        }
        catch (err) {
            console.error(pc.red(`Status query failed: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    };
    render();
    if (options.watch && !options.json) {
        setInterval(render, 2000);
    }
}
//# sourceMappingURL=status.js.map