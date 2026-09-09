import { Command } from 'commander';
import { handleInit } from './commands/init.js';
import { handleDebit } from './commands/debit.js';
import { handleCredit } from './commands/credit.js';
import { handleStatus } from './commands/status.js';
import { handleVerify } from './commands/verify.js';
import { handleExport } from './commands/export.js';
import { handlePricing } from './commands/pricing.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('agent-runway')
    .description('Autonomous runtime monitor, ledger auditor, and cost-efficiency toolkit for AI agents')
    .version('1.0.0');

  // init
  program
    .command('init')
    .description('Initialize a new runway ledger and safety guard configuration')
    .option('-b, --budget <usd>', 'Initial allocated runway budget in USD', '10.00')
    .option('-n, --name <agentName>', 'Name or identifier of the autonomous agent', 'autonomous-agent')
    .option('-c, --currency <code="USD">', 'Currency code (default: USD)', 'USD')
    .option('-k, --kill-threshold <usd>', 'Balance threshold for hard autonomous kill-switch trigger', '0.00')
    .option('-w, --warn-threshold <usd>', 'Balance threshold for safety warning and model throttling')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .option('-f, --force', 'Force overwrite of existing runway configuration')
    .action(handleInit);

  // debit
  program
    .command('debit')
    .description('Debit runway ledger for token consumption, model inference, or tool usage')
    .option('-a, --amount <usd>', 'Explicit monetary cost to debit in USD')
    .option('-m, --model <modelName>', 'Model name for automated token-cost calculation (e.g. gpt-4o, claude-3-5-sonnet)')
    .option('-t, --tokens <prompt,completion>', 'Prompt and completion token counts comma-separated (e.g. 1500,450)')
    .option('--cached <tokens>', 'Cached prompt tokens count')
    .option('--desc <description>', 'Transaction description or context summary')
    .option('--agent <agentId>', 'ID of the agent or subagent triggering the debit')
    .option('--tool <toolName>', 'Name of tool or function call associated with debit')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handleDebit);

  // credit
  program
    .command('credit')
    .description('Credit runway ledger (e.g. deposit bounty rewards, allocate funds, or top-up balance)')
    .requiredOption('-a, --amount <usd>', 'Amount in USD to credit')
    .option('--desc <description>', 'Deposit description or source of funds')
    .option('--agent <agentId>', 'Agent identifier')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handleCredit);

  // status
  program
    .command('status')
    .description('Display real-time runway status, velocity burn rate, and safety triggers')
    .option('-j, --json', 'Output machine-readable JSON status')
    .option('-w, --watch', 'Continuously watch status dashboard with automatic refresh')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handleStatus);

  // verify
  program
    .command('verify')
    .description('Perform strict cryptographic SHA-256 audit and balance verification of ledger')
    .option('-j, --json', 'Output audit results in JSON format')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handleVerify);

  // export
  program
    .command('export')
    .description('Export transaction ledger in JSON, CSV, or Markdown format')
    .option('-f, --format <format>', 'Export format (json, csv, or markdown)', 'json')
    .option('-o, --output <file>', 'Path to output file (prints to stdout if omitted)')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handleExport);

  // pricing
  program
    .command('pricing [model]')
    .description('Inspect current token pricing registry for models (OpenAI, Anthropic, Gemini, Ollama)')
    .option('-j, --json', 'Output raw pricing JSON')
    .option('-d, --dir <path>', 'Runway ledger directory', '.runway')
    .action(handlePricing);

  return program;
}
