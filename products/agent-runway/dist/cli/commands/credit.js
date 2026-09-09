import pc from 'picocolors';
import { AgentRunway } from '../../core/runway.js';
export async function handleCredit(options) {
    const dir = options.dir ?? '.runway';
    const runway = new AgentRunway(dir);
    try {
        const amount = parseFloat(options.amount);
        if (isNaN(amount) || amount <= 0) {
            console.error(pc.red('Error: Credit amount must be a positive number.'));
            process.exit(1);
        }
        const tx = await runway.credit({
            amount,
            description: options.desc ?? `Credit deposit: +$${amount.toFixed(2)}`,
            agentId: options.agent,
        });
        console.log(pc.green(`✔ Credit recorded: +$${tx.amount.toFixed(4)}`));
        console.log(`  New Balance: $${tx.balance.toFixed(4)}`);
        console.log(`  Block Index: #${tx.index}`);
        console.log(`  Block Hash:  ${pc.dim(tx.hash.substring(0, 16) + '...')}`);
        if (!runway.guard.isKillSwitchActive()) {
            console.log(pc.green('  Kill-switch: DISARMED'));
        }
    }
    catch (err) {
        console.error(pc.red(`Credit failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
}
//# sourceMappingURL=credit.js.map