import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
import { formatStatusDashboard } from '../../utils/format.js';

export interface StatusCommandOptions {
  dir?: string;
  json?: boolean;
  watch?: boolean;
}

export async function handleStatus(options: StatusCommandOptions): Promise<void> {
  const dir = options.dir ?? '.runway';
  const runway = new AgentRunway(dir);

  const render = (): void => {
    try {
      const status = runway.getStatus();
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        if (options.watch) {
          process.stdout.write('\x1Bc'); // Clear screen
        }
        console.log(formatStatusDashboard(status));
      }
    } catch (err: unknown) {
      console.error(pc.red(`Status query failed: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  };

  render();

  if (options.watch && !options.json) {
    setInterval(render, 2000);
  }
}
