import pc from 'picocolors';
import { defaultPricingRegistry } from '../../core/pricing.js';
import { formatPricingTable } from '../../utils/format.js';

export interface PricingCommandOptions {
  model?: string;
  json?: boolean;
}

export function handlePricing(modelName?: string, options: PricingCommandOptions = {}): void {
  try {
    if (modelName) {
      const p = defaultPricingRegistry.get(modelName);
      if (options.json) {
        console.log(JSON.stringify(p, null, 2));
      } else {
        console.log('');
        console.log(pc.bold(pc.cyan(`Pricing for: ${p.model} (${p.provider})`)));
        console.log(`  Prompt:     $${p.promptCostPer1M.toFixed(2)} / 1M tokens`);
        console.log(`  Completion: $${p.completionCostPer1M.toFixed(2)} / 1M tokens`);
        if (p.cachedPromptCostPer1M !== undefined) {
          console.log(`  Cached:     $${p.cachedPromptCostPer1M.toFixed(3)} / 1M tokens`);
        }
        console.log('');
      }
    } else {
      const all = defaultPricingRegistry.getAll();
      if (options.json) {
        console.log(JSON.stringify(all, null, 2));
      } else {
        console.log(formatPricingTable(all));
      }
    }
  } catch (err: unknown) {
    console.error(pc.red(`Pricing error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
