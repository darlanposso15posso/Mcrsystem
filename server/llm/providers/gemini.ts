// ─── Provider: Google Gemini ──────────────────────────────────────────────────
// Fallback primário após Claude. Limites muito generosos no plano gratuito.
//
// Hierarquia por tarefa:
//   planning  → gemini-2.5-pro       (melhor raciocínio disponível no Gemini)
//   reasoning → gemini-2.5-pro       (idem)
//   execution → gemini-2.5-flash     (rápido para código, ótimo custo-benefício)
//   simple    → gemini-2.0-flash-lite (ultrarápido para tarefas triviais)

import { GoogleGenAI } from '@google/genai';
import type { LLMMessage, LLMResponse, TaskType } from '../types.ts';

export const GEMINI_MODELS: Record<TaskType, string> = {
  planning:  process.env.GEMINI_PLANNING_MODEL  ?? 'gemini-2.5-pro',
  reasoning: process.env.GEMINI_REASONING_MODEL ?? 'gemini-2.5-pro',
  execution: process.env.GEMINI_EXECUTION_MODEL ?? 'gemini-2.5-flash',
  simple:    process.env.GEMINI_SIMPLE_MODEL    ?? 'gemini-2.5-flash',
};

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

export async function callGemini(params: {
  messages: LLMMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResponse> {
  const start = Date.now();
  const client = getClient();

  const systemInstruction = params.messages.find(m => m.role === 'system')?.content;
  const chatMessages = params.messages.filter(m => m.role !== 'system');

  // Gemini usa 'model' em vez de 'assistant' para o papel do assistente
  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const result = await client.models.generateContent({
    model: params.model,
    contents,
    config: {
      ...(systemInstruction ? { systemInstruction } : {}),
      maxOutputTokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
    },
  });

  const text = result.text ?? '';
  const usage = result.usageMetadata;

  return {
    content: text,
    model: params.model,
    provider: 'gemini',
    taskType: 'simple', // será sobrescrito pelo router
    inputTokens:  usage?.promptTokenCount    ?? 0,
    outputTokens: usage?.candidatesTokenCount ?? 0,
    latencyMs: Date.now() - start,
  };
}
