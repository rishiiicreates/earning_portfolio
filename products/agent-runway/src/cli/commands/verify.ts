import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
import { formatVerificationReport } from '../../utils/format.js';

export interface VerifyCommandOptions {
  dir?: string;
  json?: boolean;
}

export async function handleVerify(options: VerifyCommandOptions): Promise<void> {
  const dir = options.dir ?? '.runway';
  const runway = new AgentRunway(dir);

  try {
    const result = runway.verify();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatVerificationReport(result));
    }

    if (!result.valid) {
      process.exit(1);
    }
  } catch (err: unknown) {
    console.error(pc.red(`Verification error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
