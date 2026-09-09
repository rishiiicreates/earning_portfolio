import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRunway } from '../../src/core/runway.js';
import { wrapOpenAI } from '../../src/integrations/openai.js';
import { wrapAnthropic } from '../../src/integrations/anthropic.js';
import { wrapGemini } from '../../src/integrations/gemini.js';
import { wrapOllama } from '../../src/integrations/ollama.js';
import { trackToolExecution } from '../../src/integrations/tool-interceptor.js';

describe('SDK Integrations & Tool Interceptors', () => {
  let tmpDir: string;
  let runway: AgentRunway;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runway-integrations-test-'));
    runway = new AgentRunway(tmpDir);
    await runway.init({ budget: 50.0 });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('wrapOpenAI', () => {
    it('should intercept chat completions and record debit', async () => {
      const createSpy = vi.fn().mockResolvedValue({
        id: 'chatcmpl-123',
        choices: [
          {
            message: {
              content: 'Hello world',
              tool_calls: [{ function: { name: 'calculator' } }],
            },
          },
        ],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 200,
          total_tokens: 1200,
          prompt_tokens_details: { cached_tokens: 200 },
        },
      });

      const mockOpenAI = {
        chat: {
          completions: {
            create: createSpy,
          },
        },
      };

      const usageCallback = vi.fn();
      const wrapped = wrapOpenAI(mockOpenAI, runway, {
        agentId: 'openai-worker',
        onUsageTracked: usageCallback,
      });

      const res = await wrapped.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
      });

      expect(res.id).toBe('chatcmpl-123');
      expect(createSpy).toHaveBeenCalled();
      expect(usageCallback).toHaveBeenCalled();

      const status = runway.getStatus();
      expect(status.tokens.totalPrompt).toBe(1000);
      expect(status.tokens.totalCompletion).toBe(200);
      expect(status.tokens.totalCached).toBe(200);
      expect(status.totalSpent).toBeGreaterThan(0);
    });

    it('should pass through streaming requests without debit', async () => {
      const mockStream = { [Symbol.asyncIterator]: vi.fn() };
      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue(mockStream),
          },
        },
      };

      const wrapped = wrapOpenAI(mockOpenAI, runway);
      const res = await wrapped.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'stream test' }],
        stream: true,
      });

      expect(res).toBe(mockStream);
      expect(runway.getStatus().transactionCount).toBe(1); // Only genesis
    });
  });

  describe('wrapAnthropic', () => {
    it('should intercept messages.create and account for prompt caching', async () => {
      const mockAnthropic = {
        messages: {
          create: vi.fn().mockResolvedValue({
            id: 'msg_123',
            content: [{ type: 'tool_use', name: 'execute_bash', input: {} }],
            usage: {
              input_tokens: 5000,
              output_tokens: 800,
              cache_read_input_tokens: 4000,
              cache_creation_input_tokens: 1000,
            },
          }),
        },
      };

      const wrapped = wrapAnthropic(mockAnthropic, runway, {
        agentId: 'claude-agent',
      });

      const res = await wrapped.messages.create({
        model: 'claude-3-5-sonnet',
        messages: [{ role: 'user', content: 'test prompt' }],
      });

      expect(res.id).toBe('msg_123');

      const latestTx = runway.ledger.getLatestTransaction();
      expect(latestTx?.model).toBe('claude-3-5-sonnet');
      expect(latestTx?.toolCall?.name).toBe('execute_bash');
      expect(latestTx?.tokens?.cachedPromptTokens).toBe(4000);
      expect(latestTx?.tokens?.cacheCreationTokens).toBe(1000);
    });
  });

  describe('wrapGemini', () => {
    it('should intercept generateContent and extract usageMetadata', async () => {
      const mockModel = {
        model: 'gemini-1.5-pro',
        generateContent: vi.fn().mockResolvedValue({
          response: {
            usageMetadata: {
              promptTokenCount: 1500,
              candidatesTokenCount: 400,
              totalTokenCount: 1900,
              cachedContentTokenCount: 500,
            },
            functionCalls: () => [{ name: 'fetch_weather' }],
          },
        }),
      };

      const wrapped = wrapGemini(mockModel, runway);
      await wrapped.generateContent('What is the weather?');

      const latestTx = runway.ledger.getLatestTransaction();
      expect(latestTx?.model).toBe('gemini-1.5-pro');
      expect(latestTx?.toolCall?.name).toBe('fetch_weather');
      expect(latestTx?.tokens?.promptTokens).toBe(1500);
      expect(latestTx?.tokens?.completionTokens).toBe(400);
    });
  });

  describe('wrapOllama', () => {
    it('should intercept chat and record local compute tokens', async () => {
      const mockOllama = {
        chat: vi.fn().mockResolvedValue({
          model: 'llama3.2',
          prompt_eval_count: 800,
          eval_count: 300,
          message: {
            content: 'Local answer',
            tool_calls: [{ function: { name: 'local_cmd' } }],
          },
        }),
      };

      const wrapped = wrapOllama(mockOllama, runway, {
        costPer1MPrompt: 0.1, // Custom compute charge
        costPer1MCompletion: 0.2,
      });

      await wrapped.chat({ model: 'llama3.2' });

      const latestTx = runway.ledger.getLatestTransaction();
      expect(latestTx?.model).toBe('llama3.2');
      expect(latestTx?.toolCall?.name).toBe('local_cmd');
      expect(latestTx?.tokens?.totalTokens).toBe(1100);
      expect(latestTx?.cost).toBeGreaterThan(0);
    });
  });

  describe('trackToolExecution', () => {
    it('should track successful tool execution', async () => {
      const result = await trackToolExecution(
        runway,
        'database_query',
        { table: 'users', limit: 10 },
        async () => ['user1', 'user2'],
        { estimatedCost: 0.02, agentId: 'db-agent' }
      );

      expect(result).toEqual(['user1', 'user2']);

      const latestTx = runway.ledger.getLatestTransaction();
      expect(latestTx?.toolCall?.name).toBe('database_query');
      expect(latestTx?.cost).toBe(0.02);
      expect(latestTx?.metadata?.success).toBe(true);
    });

    it('should track failed tool execution and rethrow error', async () => {
      await expect(
        trackToolExecution(
          runway,
          'failing_tool',
          { id: 123 },
          async () => {
            throw new Error('Network timeout');
          },
          { estimatedCost: 0.01 }
        )
      ).rejects.toThrow('Network timeout');

      const latestTx = runway.ledger.getLatestTransaction();
      expect(latestTx?.toolCall?.name).toBe('failing_tool');
      expect(latestTx?.metadata?.success).toBe(false);
      expect(latestTx?.metadata?.error).toBe('Network timeout');
    });
  });
});
