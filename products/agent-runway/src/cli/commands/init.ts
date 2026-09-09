import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';

export interface InitCommandOptions {
  budget?: string;
  name?: string;
  currency?: string;
  killThreshold?: string;
  warnThreshold?: string;
  dir?: string;
  force?: boolean;
}

export async function handleInit(options: InitCommandOptions): Promise<void> {
  const dir = options.dir ?? '.runway';
  const runway = new AgentRunway(dir);

  const budget = options.budget ? parseFloat(options.budget) : 10.0;
  const killThreshold = options.killThreshold ? parseFloat(options.killThreshold) : 0.0;
  const warnThreshold = options.warnThreshold
    ? parseFloat(options.warnThreshold)
    : Number((budget * 0.2).toFixed(2));

  try {
    const config = await runway.init({
      budget,
      name: options.name ?? 'autonomous-agent',
      currency: options.currency ?? 'USD',
      killThreshold,
      warnThreshold,
      overwrite: options.force,
    });

    console.log(pc.green(pc.bold('✔ Agent Runway initialized successfully!')));
    console.log(`  Directory:      ${pc.cyan(runway.runwayDir)}`);
    console.log(`  Agent Name:     ${pc.bold(config.agentName)}`);
    console.log(`  Initial Budget: $${config.initialBudget.toFixed(2)} ${config.currency}`);
    console.log(`  Kill Threshold: $${config.killThreshold.toFixed(2)} (Hard kill-switch)`);
    console.log(`  Warn Threshold: $${config.warnThreshold.toFixed(2)} (Throttle trigger)`);
    console.log('');
    console.log(pc.dim('Append-only ledger genesis block established with SHA-256 root hash.'));
  } catch (err: unknown) {
    console.error(pc.red(`Initialization failed: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
