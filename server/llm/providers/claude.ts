// ─── Provider: Anthropic Claude ───────────────────────────────────────────────
// Melhores modelos: raciocínio/planejamento → Opus, código/execução → Sonnet
//
// Hierarquia por tarefa:
//   planning  → claude-opus-4-6      (melhor raciocínio estratégico)
//   reasoning → claude-opus-4-6      (melhor raciocínio lógico)
//   execution → claude-sonnet-4-6    (melhor custo-benefício para código)
//   simple    → claude-haiku-4-5     (rápido e barato para tarefas simples)

import Anthropic from '@anthropic-ai/sdk';
import type { LLMMessage, LLMResponse, TaskType } from '../types.ts';

export const CLAUDE_MODELS: Record<TaskType, string> = {
  planning:  process.env.CLAUDE_PLANNING_MODEL  ?? 'claude-opus-4-6',
  reasoning: process.env.CLAUDE_REASONING_MODEL ?? 'claude-opus-4-6',
  execution: process.env.CLAUDE_EXECUTION_MODEL ?? 'claude-sonnet-4-6',
  simple:    process.env.CLAUDE_SIMPLE_MODEL    ?? 'claude-haiku-4-5-20251001',
};

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function callClaude(params: {
  messages: LLMMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResponse> {
  const start = Date.now();
  const client = getClient();

  const systemMsg = params.messages.find(m => m.role === 'system')?.content;
  const chatMessages = params.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model: params.model,
    max_tokens: params.maxTokens ?? 4096,
    temperature: params.temperature ?? 0.7,
    ...(systemMsg ? { system: systemMsg } : {}),
    messages: chatMessages,
  });

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  return {
    content,
    model: response.model,
    provider: 'claude',
    taskType: 'simple', // será sobrescrito pelo router
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs: Date.now() - start,
  };
}
