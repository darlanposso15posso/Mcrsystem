// ─── LLM Router ───────────────────────────────────────────────────────────────
//
// Lógica de roteamento inteligente:
//
//  1. Detecta o tipo de tarefa automaticamente (planning / execution /
//     reasoning / simple) analisando o conteúdo da mensagem.
//
//  2. Seleciona o provider com base na PRIORIDADE e no USO ATUAL:
//       Claude → Gemini → Ollama (local, sem limites)
//
//  3. Antes de atingir o limite configurado de cada provider (padrão 80 %),
//     o roteador avança para o próximo automaticamente.
//
//  4. Mapeia o MELHOR modelo de cada provider para o tipo de tarefa:
//       planning/reasoning  → modelos com melhor raciocínio  (Opus / 2.5-Pro / DeepSeek-R1)
//       execution           → modelos especializados em código (Sonnet / Flash / Qwen-Coder)
//       simple              → modelos leves e rápidos
//
//  5. Em caso de falha do provider, faz fallback automático para o próximo.
//
// Uso:
//   import { route } from './llm/router.ts';
//   const response = await route({ messages: [...] });

import { callClaude, CLAUDE_MODELS } from './providers/claude.ts';
import { callGemini, GEMINI_MODELS } from './providers/gemini.ts';
import {
  callOllama,
  OLLAMA_MODELS,
  checkOllamaAvailable,
  listOllamaModels,
  isModelAvailable,
} from './providers/ollama.ts';
import { recordUsage, getDailyUsage } from './usage-tracker.ts';
import type {
  LLMRequest,
  LLMResponse,
  TaskType,
  ProviderName,
  ProviderStatus,
} from './types.ts';

// ─── Limites por provider ─────────────────────────────────────────────────────
// Sobrescreva via variáveis de ambiente conforme o seu plano.

const LIMITS = {
  claude: {
    dailyTokens:       parseInt(process.env.CLAUDE_DAILY_TOKEN_LIMIT   ?? '100000'),
    switchThresholdPct: parseInt(process.env.CLAUDE_SWITCH_THRESHOLD   ?? '80'),
  },
  gemini: {
    dailyTokens:       parseInt(process.env.GEMINI_DAILY_TOKEN_LIMIT   ?? '1000000'),
    switchThresholdPct: parseInt(process.env.GEMINI_SWITCH_THRESHOLD   ?? '85'),
  },
  ollama: {
    dailyTokens:       Infinity, // local — sem limite
    switchThresholdPct: 100,
  },
} as const;

// Ordem de prioridade: Claude primeiro, depois Gemini, depois local
const PROVIDER_ORDER: ProviderName[] = ['claude', 'gemini', 'ollama'];

// ─── Detecção automática de tipo de tarefa ────────────────────────────────────

const TASK_KEYWORDS: Record<TaskType, string[]> = {
  planning: [
    // EN
    'plan', 'architect', 'design', 'strategy', 'roadmap', 'structure',
    'outline', 'review', 'evaluate', 'assess', 'compare', 'prioritize',
    'organize', 'workflow',
    // PT
    'planejamento', 'planejar', 'arquitetura', 'estratégia', 'estruturar',
    'avaliar', 'priorizar', 'organizar', 'roteiro', 'fluxo',
  ],
  execution: [
    // EN
    'code', 'implement', 'write', 'create', 'build', 'generate',
    'fix', 'debug', 'refactor', 'function', 'class', 'component',
    'api', 'endpoint', 'query', 'script', 'migration',
    // PT
    'código', 'implementar', 'criar', 'escrever', 'construir', 'gerar',
    'corrigir', 'depurar', 'refatorar', 'função', 'componente', 'endpoint',
    'consulta', 'migração',
  ],
  reasoning: [
    // EN
    'why', 'explain', 'how does', 'understand', 'complex', 'logic',
    'algorithm', 'analyze', 'infer', 'deduce', 'solve', 'calculate',
    // PT
    'por que', 'explicar', 'como funciona', 'entender', 'lógica',
    'algoritmo', 'analisar', 'deduzir', 'resolver', 'calcular',
  ],
  simple: [],
};

export function detectTaskType(messages: { role: string; content: string }[]): TaskType {
  const lastUser = [...messages]
    .reverse()
    .find(m => m.role === 'user')
    ?.content.toLowerCase() ?? '';

  const scores = {
    planning:  TASK_KEYWORDS.planning.filter(k => lastUser.includes(k)).length,
    execution: TASK_KEYWORDS.execution.filter(k => lastUser.includes(k)).length,
    reasoning: TASK_KEYWORDS.reasoning.filter(k => lastUser.includes(k)).length,
  };

  const max = Math.max(scores.planning, scores.execution, scores.reasoning);
  if (max === 0) return 'simple';
  if (scores.planning  === max) return 'planning';
  if (scores.execution === max) return 'execution';
  return 'reasoning';
}

// ─── Helpers de provider ──────────────────────────────────────────────────────

function isConfigured(provider: ProviderName): boolean {
  if (provider === 'claude') return !!process.env.ANTHROPIC_API_KEY;
  if (provider === 'gemini') return !!process.env.GEMINI_API_KEY;
  return true; // ollama — verificado separadamente (async)
}

function getUsagePct(provider: ProviderName): number {
  const limit = LIMITS[provider].dailyTokens;
  if (limit === Infinity) return 0;
  const { tokens } = getDailyUsage(provider);
  return Math.round((tokens / limit) * 100);
}

function getModelForTask(provider: ProviderName, task: TaskType): string {
  if (provider === 'claude') return CLAUDE_MODELS[task];
  if (provider === 'gemini') return GEMINI_MODELS[task];
  return OLLAMA_MODELS[task];
}

async function invoke(
  provider: ProviderName,
  request: LLMRequest,
  task: TaskType,
): Promise<LLMResponse> {
  const model = getModelForTask(provider, task);
  const p = { messages: request.messages, model, maxTokens: request.maxTokens, temperature: request.temperature };

  let response: LLMResponse;
  if (provider === 'claude')  response = await callClaude(p);
  else if (provider === 'gemini') response = await callGemini(p);
  else response = await callOllama(p);

  response.taskType = task;
  return response;
}

// ─── Roteador principal ───────────────────────────────────────────────────────

export async function route(request: LLMRequest): Promise<LLMResponse> {
  const task: TaskType = request.taskType ?? detectTaskType(request.messages);

  // Provider forçado pelo chamador — ignora limites, mas registra uso
  if (request.forceProvider) {
    const response = await invoke(request.forceProvider, request, task);
    recordUsage({
      provider: request.forceProvider,
      model: response.model,
      taskType: task,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      latencyMs: response.latencyMs,
      success: true,
    });
    return response;
  }

  // Verifica disponibilidade do Ollama uma vez por chamada
  const ollamaRunning = await checkOllamaAvailable();

  const errors: string[] = [];

  for (const provider of PROVIDER_ORDER) {
    // Pula se não está configurado ou (no caso do Ollama) não está rodando
    if (!isConfigured(provider)) continue;
    if (provider === 'ollama' && !ollamaRunning) continue;

    // Verifica se o modelo específico está disponível no Ollama
    if (provider === 'ollama') {
      const model = getModelForTask('ollama', task);
      const available = await isModelAvailable(model);
      if (!available) {
        const all = await listOllamaModels();
        console.warn(`[LLM Router] Modelo '${model}' não encontrado no Ollama. Disponíveis: ${all.join(', ') || 'nenhum'}`);
        continue;
      }
    }

    const pct = getUsagePct(provider);
    const threshold = LIMITS[provider].switchThresholdPct;

    if (pct >= threshold) {
      console.log(`[LLM Router] ${provider} está em ${pct}% do limite diário — pulando para o próximo`);
      continue;
    }

    const model = getModelForTask(provider, task);
    console.log(`[LLM Router] → ${provider}/${model} | tarefa: ${task} | uso hoje: ${pct}%`);

    try {
      const response = await invoke(provider, request, task);

      recordUsage({
        provider,
        model: response.model,
        taskType: task,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        latencyMs: response.latencyMs,
        success: true,
      });

      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[LLM Router] ${provider} falhou: ${msg}`);
      errors.push(`${provider}: ${msg}`);

      recordUsage({
        provider,
        model,
        taskType: task,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        success: false,
        errorMsg: msg,
      });
      // continua para o próximo provider
    }
  }

  throw new Error(`Todos os providers falharam. Erros: ${errors.join(' | ')}`);
}

// ─── Status e diagnóstico ─────────────────────────────────────────────────────

export async function getProvidersStatus(): Promise<ProviderStatus[]> {
  const ollamaRunning = await checkOllamaAvailable();
  const ollamaModels  = ollamaRunning ? await listOllamaModels() : [];

  return PROVIDER_ORDER.map(provider => {
    const usage   = getDailyUsage(provider);
    const limits  = LIMITS[provider];
    const pct     = getUsagePct(provider);

    let available = isConfigured(provider);
    if (provider === 'ollama') available = available && ollamaRunning;

    const models = {
      planning:  getModelForTask(provider, 'planning'),
      reasoning: getModelForTask(provider, 'reasoning'),
      execution: getModelForTask(provider, 'execution'),
      simple:    getModelForTask(provider, 'simple'),
    };

    return {
      name: provider,
      available,
      usageToday: usage,
      limits: {
        dailyTokens:        limits.dailyTokens,
        switchThresholdPct: limits.switchThresholdPct,
      },
      usagePct: pct,
      models,
      ...(provider === 'ollama' ? { localModels: ollamaModels } : {}),
    } as ProviderStatus;
  });
}

export { detectTaskType as classifyTask };
