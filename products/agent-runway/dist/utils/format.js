import pc from 'picocolors';
export function formatCurrency(amount, currency = 'USD') {
    const sign = amount < 0 ? '-' : '';
    const abs = Math.abs(amount);
    return `${sign}$${abs.toFixed(4)} ${currency}`;
}
export function formatTokens(count) {
    return count.toLocaleString('en-US');
}
export function formatDuration(minutes) {
    if (minutes === null)
        return 'N/A (no burn)';
    if (minutes < 1)
        return '< 1 min';
    if (minutes < 60)
        return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = Math.round(minutes % 60);
    return `${hours}h ${remMinutes}m`;
}
/**
 * Formats a terminal dashboard for `agent-runway status`.
 */
export function formatStatusDashboard(status) {
    const lines = [];
    const stateBadge = status.state === 'HEALTHY'
        ? pc.bgGreen(pc.black(' HEALTHY '))
        : status.state === 'THROTTLED'
            ? pc.bgYellow(pc.black(' THROTTLED '))
            : pc.bgRed(pc.white(pc.bold(' KILLSWITCH ACTIVE ')));
    const killSwitchBadge = status.killSwitchActive
        ? pc.red('ARMED (Sentinel file present)')
        : pc.green('DISARMED (Normal operation)');
    lines.push('');
    lines.push(pc.bold(pc.cyan('=== AGENT RUNWAY MONITOR ===')));
    lines.push(`${pc.dim('Agent:')} ${pc.bold(status.agentName)}  |  ${pc.dim('State:')} ${stateBadge}`);
    lines.push('');
    lines.push(pc.bold('--- Balance & Runway ---'));
    lines.push(`  ${pc.dim('Initial Budget:')}   $${status.initialBudget.toFixed(2)} ${status.currency}`);
    lines.push(`  ${pc.dim('Current Balance:')}  ${pc.bold(status.currentBalance <= 0
        ? pc.red(`$${status.currentBalance.toFixed(4)} ${status.currency}`)
        : status.state === 'THROTTLED'
            ? pc.yellow(`$${status.currentBalance.toFixed(4)} ${status.currency}`)
            : pc.green(`$${status.currentBalance.toFixed(4)} ${status.currency}`))}`);
    lines.push(`  ${pc.dim('Total Spent:')}      $${status.totalSpent.toFixed(4)} ${status.currency}`);
    lines.push(`  ${pc.dim('Total Credited:')}   $${status.totalCredited.toFixed(4)} ${status.currency}`);
    lines.push('');
    lines.push(pc.bold('--- Velocity & Burn Rate ---'));
    lines.push(`  ${pc.dim('Burn Velocity:')}    $${status.burnRate.perMinute.toFixed(4)}/min  ($${status.burnRate.perHour.toFixed(2)}/hr)`);
    lines.push(`  ${pc.dim('Token Velocity:')}   ${formatTokens(status.burnRate.tokensPerMinute)} tokens/min`);
    lines.push(`  ${pc.dim('Time Remaining:')}   ${pc.bold(status.runwayRemaining.estimatedMinutes !== null
        ? pc.magenta(formatDuration(status.runwayRemaining.estimatedMinutes))
        : pc.dim('Infinite (idle)'))}`);
    if (status.runwayRemaining.estimatedTasks !== null) {
        lines.push(`  ${pc.dim('Tasks Remaining:')}  ~${status.runwayRemaining.estimatedTasks} tasks`);
    }
    lines.push('');
    lines.push(pc.bold('--- Cumulative Tokens ---'));
    lines.push(`  ${pc.dim('Prompt Tokens:')}    ${formatTokens(status.tokens.totalPrompt)}`);
    lines.push(`  ${pc.dim('Output Tokens:')}    ${formatTokens(status.tokens.totalCompletion)}`);
    lines.push(`  ${pc.dim('Cached Tokens:')}    ${formatTokens(status.tokens.totalCached)}`);
    lines.push(`  ${pc.dim('Total Tokens:')}     ${pc.bold(formatTokens(status.tokens.totalAll))}`);
    lines.push('');
    lines.push(pc.bold('--- Safety Controls ---'));
    lines.push(`  ${pc.dim('Kill-Switch:')}      ${killSwitchBadge}`);
    lines.push(`  ${pc.dim('Transactions:')}     ${status.transactionCount} entries recorded`);
    if (status.throttleAdvice) {
        lines.push('');
        lines.push(pc.yellow(pc.bold('⚠️  THROTTLE DIRECTIVE ACTIVE:')));
        lines.push(`  ${pc.yellow(status.throttleAdvice.message)}`);
        lines.push(`  ${pc.dim('Suggested Models:')} ${status.throttleAdvice.suggestedFallbackModels.join(', ')}`);
        lines.push(`  ${pc.dim('Rate Delay:')}       ${status.throttleAdvice.rateLimitDelayMs}ms backoff per step`);
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Formats cryptographic ledger verification output.
 */
export function formatVerificationReport(result) {
    const lines = [];
    lines.push('');
    lines.push(pc.bold(pc.cyan('=== LEDGER CRYPTOGRAPHIC AUDIT ===')));
    lines.push(`Total Transactions: ${result.totalTransactions}`);
    lines.push(`Genesis Hash:       ${pc.dim(result.genesisHash.substring(0, 16) + '...')}`);
    lines.push(`Latest Hash:        ${pc.dim(result.latestHash.substring(0, 16) + '...')}`);
    lines.push(`Recorded Balance:   $${result.finalBalance.toFixed(6)}`);
    lines.push(`Computed Balance:   $${result.expectedBalance.toFixed(6)}`);
    lines.push('');
    if (result.valid) {
        lines.push(pc.green(pc.bold('✔ AUDIT PASSED: All hashes and balances cryptographically verified.')));
        lines.push(pc.dim('Ledger is immutable, strictly append-only, and tamper-free.'));
    }
    else {
        lines.push(pc.red(pc.bold(`✖ AUDIT FAILED: ${result.errors.length} integrity violations detected!`)));
        lines.push('');
        for (const err of result.errors) {
            lines.push(pc.red(`  [Block #${err.index}] ${err.type}: ${err.message}`));
            if (err.details) {
                lines.push(pc.dim(`    ${JSON.stringify(err.details)}`));
            }
        }
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Formats model pricing table.
 */
export function formatPricingTable(pricingList) {
    const lines = [];
    lines.push(pc.bold(pc.cyan('=== MODEL PRICING REGISTRY (per 1M tokens) ===')));
    lines.push(`${'Provider'.padEnd(12)} ${'Model'.padEnd(26)} ${'Prompt ($)'.padEnd(12)} ${'Comp ($)'.padEnd(12)} ${'Cached ($)'}`);
    lines.push('-'.repeat(75));
    for (const p of pricingList) {
        const cached = p.cachedPromptCostPer1M !== undefined ? `$${p.cachedPromptCostPer1M.toFixed(3)}` : '-';
        lines.push(`${p.provider.padEnd(12)} ${p.model.padEnd(26)} $${p.promptCostPer1M.toFixed(2).padEnd(11)} $${p.completionCostPer1M.toFixed(2).padEnd(11)} ${cached}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=format.js.map