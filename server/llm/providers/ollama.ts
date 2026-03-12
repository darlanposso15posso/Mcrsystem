// ─── Provider: Ollama (modelos locais) ────────────────────────────────────────
// Fallback final — sem limites de uso, funciona 100% offline.
// Compatível com Ollama, LM Studio, Jan.ai e qualquer servidor
// OpenAI-compatible rodando localmente.
//
// Hierarquia por tarefa (configurável via variáveis de ambiente):
//   planning  → deepseek-r1:32b      (melhor raciocínio open source disponível)
//   reasoning → deepseek-r1:32b      (idem)
//   execution → qwen2.5-coder:32b    (estado da arte em geração de código)
//   simple    → llama3.2:3b          (leve e rápido para tarefas triviais)
//
// Outros modelos recomendados:
//   Código   : deepseek-coder-v2, codellama:34b, starcoder2:15b
//   Raciocínio: qwen3:32b, phi4, mistral-large
//   Leve     : phi3.5, gemma2:2b, qwen2.5:3b

import type { LLMMessage, LLMResponse, TaskType } from '../types.ts';

const BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

export const OLLAMA_MODELS: Record<TaskType, string> = {
  planning:  process.env.OLLAMA_PLANNING_MODEL  ?? 'deepseek-r1:32b',
  reasoning: process.env.OLLAMA_REASONING_MODEL ?? 'deepseek-r1:32b',
  execution: process.env.OLLAMA_EXECUTION_MODEL ?? 'qwen2.5-coder:32b',
  simple:    process.env.OLLAMA_SIMPLE_MODEL    ?? 'llama3.2:3b',
};

/** Verifica se o servidor local está respondendo (timeout de 2 s). */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Lista os modelos disponíveis no servidor local. */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: { name: string }[] };
    return (data.models ?? []).map(m => m.name);
  } catch {
    return [];
  }
}

/** Verifica se um modelo específico está baixado localmente. */
export async function isModelAvailable(model: string): Promise<boolean> {
  const models = await listOllamaModels();
  // Normaliza: "deepseek-r1:32b" ou "deepseek-r1" podem coexistir
  return models.some(m => m === model || m.startsWith(model.split(':')[0]));
}

export async function callOllama(params: {
  messages: LLMMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResponse> {
  const start = Date.now();

  // Usa a API OpenAI-compatible exposta pelo Ollama (/v1/chat/completions)
  // Funciona também com LM Studio (http://localhost:1234/v1) e Jan.ai
  const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      stream: false,
    }),
    signal: AbortSignal.timeout(180_000), // 3 min — modelos grandes podem demorar
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Ollama ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  const content = data.choices?.[0]?.message?.content ?? '';

  return {
    content,
    model: data.model ?? params.model,
    provider: 'ollama',
    taskType: 'simple', // será sobrescrito pelo router
    inputTokens:  data.usage?.prompt_tokens      ?? 0,
    outputTokens: data.usage?.completion_tokens  ?? 0,
    latencyMs: Date.now() - start,
  };
}
