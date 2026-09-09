import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
import { RunwayExhaustedError } from '../../core/errors.js';

export interface DebitCommandOptions {
  amount?: string;
  tokens?: string; // "prompt,completion"
  cached?: string;
  model?: string;
  desc?: string;
  agent?: string;
  tool?: string;
  dir?: string;
}

export async function handleDebit(options: DebitCommandOptions): Promise<void> {
  const dir = options.dir ?? '.runway';
  const runway = new AgentRunway(dir);

  try {
    let promptTokens = 0;
    let completionTokens = 0;
    let cachedTokens = 0;

    if (options.tokens) {
      const parts = options.tokens.split(',').map((p) => parseInt(p.trim(), 10));
      promptTokens = parts[0] || 0;
      completionTokens = parts[1] || 0;
    }

    if (options.cached) {
      cachedTokens = parseInt(options.cached.trim(), 10) || 0;
    }

    const tx = await runway.debit({
      amount: options.amount ? parseFloat(options.amount) : undefined,
      model: options.model,
      tokens: options.tokens
        ? {
            promptTokens,
            completionTokens,
            cachedPromptTokens: cachedTokens,
            totalTokens: promptTokens + completionTokens,
          }
        : undefined,
      description: options.desc,
      agentId: options.agent,
      toolCall: options.tool ? { name: options.tool } : undefined,
    });

    console.log(pc.green(`✔ Debit recorded: -$${Math.abs(tx.amount).toFixed(4)}`));
    console.log(`  Balance:     $${tx.balance.toFixed(4)}`);
    console.log(`  Block Index: #${tx.index}`);
    console.log(`  Block Hash:  ${pc.dim(tx.hash.substring(0, 16) + '...')}`);
    if (tx.model) {
      console.log(`  Model:       ${tx.model}`);
    }
  } catch (err: unknown) {
    if (err instanceof RunwayExhaustedError) {
      console.error(pc.bgRed(pc.white(pc.bold(' KILL-SWITCH TRIGGERED '))));
      console.error(pc.red(err.message));
      process.exit(78); // EX_CONFIG / runway exhausted
    }
    console.error(pc.red(`Debit failed: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
