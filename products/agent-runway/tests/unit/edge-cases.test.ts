import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentRunway } from '../../src/core/runway.js';
import { Ledger } from '../../src/core/ledger.js';
import {
  RunwayThrottledError,
  RunwayNotInitializedError,
  LedgerCorruptedError,
} from '../../src/core/errors.js';
import { wrapOpenAI } from '../../src/integrations/openai.js';
import { wrapAnthropic } from '../../src/integrations/anthropic.js';
import { wrapGemini } from '../../src/integrations/gemini.js';
import { wrapOllama } from '../../src/integrations/ollama.js';
import { trackToolExecution } from '../../src/integrations/tool-interceptor.js';

describe('Edge Cases and Branch Coverage', () => {
  let tmpDir: string;
  let runway: AgentRunway;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-edge-test-'));
    runway = new AgentRunway(tmpDir);
    await runway.init({ budget: 30.0, killThreshold: 1.0, warnThreshold: 6.0 });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should instantiate RunwayThrottledError with balance and warnThreshold', () => {
    const err = new RunwayThrottledError(5.5, 6.0);
    expect(err.name).toBe('RunwayThrottledError');
    expect(err.balance).toBe(5.5);
    expect(err.warnThreshold).toBe(6.0);
    expect(err.message).toContain('Runway Throttled');
  });

  it('should cover SDK wrappers with empty/invalid client objects', () => {
    const dummyObj = {};
    expect(wrapOpenAI(dummyObj as any, runway)).toBe(dummyObj);
    expect(wrapAnthropic(dummyObj as any, runway)).toBe(dummyObj);
    expect(wrapGemini(dummyObj as any, runway)).toBe(dummyObj);
    expect(wrapOllama(dummyObj as any, runway)).toBe(dummyObj);
  });

  it('should cover Anthropic and Gemini streaming or missing usage branches', async () => {
    // Anthropic streaming
    const mockAnthropic = {
      messages: {
        create: async () => ({ [Symbol.asyncIterator]: () => {} }),
      },
    };
    const wrappedAnthropic = wrapAnthropic(mockAnthropic as any, runway);
    await wrappedAnthropic.messages.create({
      model: 'claude-3-5-sonnet',
      messages: [],
      stream: true,
    });

    // Anthropic without usage
    const mockAnthropicNoUsage = {
      messages: {
        create: async () => ({ id: 'no-usage' }),
      },
    };
    const wrappedAnthropicNoUsage = wrapAnthropic(mockAnthropicNoUsage as any, runway);
    await wrappedAnthropicNoUsage.messages.create({
      model: 'claude-3-5-sonnet',
      messages: [],
    });

    // Gemini without usage
    const mockGeminiNoUsage = {
      generateContent: async () => ({ response: {} }),
    };
    const wrappedGeminiNoUsage = wrapGemini(mockGeminiNoUsage as any, runway);
    await wrappedGeminiNoUsage.generateContent('test');
  });

  it('should cover Ollama generate method and streaming', async () => {
    const mockOllama = {
      generate: async () => ({
        prompt_eval_count: 50,
        eval_count: 50,
      }),
    };
    const wrappedOllama = wrapOllama(mockOllama as any, runway);
    await wrappedOllama.generate({ model: 'llama3.2' });

    // Ollama streaming
    const mockOllamaStream = {
      generate: async () => 'stream-chunk',
    };
    const wrappedOllamaStream = wrapOllama(mockOllamaStream as any, runway);
    await wrappedOllamaStream.generate({ model: 'llama3.2', stream: true });
  });

  it('should cover trackToolExecution custom parameter extractor and non-object args', async () => {
    // Custom summary extractor
    await trackToolExecution(
      runway,
      'custom_summary_tool',
      { query: 'test', page: 2 },
      async () => 'ok',
      {
        extractParametersSummary: (args: any) => `q=${args.query}`,
        estimatedCost: 0.01,
      }
    );

    // Non-object args (e.g. primitive number)
    await trackToolExecution(
      runway,
      'primitive_tool',
      42,
      async () => 'ok',
      { estimatedCost: 0.01 }
    );
  });

  it('should cover runway instance export, verify, disarmKillSwitch, and assertCanExecute', async () => {
    expect(runway.export('json')).toBeDefined();
    expect(runway.export('csv')).toBeDefined();
    expect(runway.export('markdown')).toBeDefined();
    expect(runway.verify().valid).toBe(true);

    expect(runway.disarmKillSwitch()).toBe(false); // Was not armed
    expect(() => runway.assertCanExecute(1.0)).not.toThrow();
  });

  it('should cover ledger empty verification and corrupted index detection', async () => {
    const emptyLedgerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-ledger-test-'));
    const emptyLedger = new Ledger(emptyLedgerDir);
    const audit = emptyLedger.verifyLedger();
    expect(audit.valid).toBe(false);
    expect(audit.errors[0].type).toBe('CORRUPTED_ENTRY');

    // Corrupted index test
    await runway.debit({ amount: 1.0 });
    const lines = fs.readFileSync(runway.ledger.ledgerPath, 'utf8').trim().split('\n');
    const tx = JSON.parse(lines[1]);
    tx.index = 99; // Corrupted index
    lines[1] = JSON.stringify(tx);
    fs.writeFileSync(runway.ledger.ledgerPath, lines.join('\n') + '\n', 'utf8');

    const indexAudit = runway.ledger.verifyLedger();
    expect(indexAudit.valid).toBe(false);
    expect(indexAudit.errors.some((e) => e.message.includes('index mismatch'))).toBe(true);

    fs.rmSync(emptyLedgerDir, { recursive: true, force: true });
  });

  it('should cover ledger overwrite behavior', async () => {
    // Calling initialize again without overwrite returns existing config
    const existing = await runway.ledger.initialize({ budget: 999.0, overwrite: false });
    expect(existing.initialBudget).toBe(30.0); // Kept previous

    // With overwrite
    const overwritten = await runway.ledger.initialize({ budget: 50.0, overwrite: true });
    expect(overwritten.initialBudget).toBe(50.0);
  });
});
