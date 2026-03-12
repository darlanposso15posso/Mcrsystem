// ─── LLM Router - Tipos e Interfaces ─────────────────────────────────────────

export type TaskType = 'planning' | 'execution' | 'reasoning' | 'simple';
export type ProviderName = 'claude' | 'gemini' | 'ollama';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  /** Tipo da tarefa — detectado automaticamente se omitido */
  taskType?: TaskType;
  maxTokens?: number;
  temperature?: number;
  /** Força um provider específico, ignorando o roteamento automático */
  forceProvider?: ProviderName;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: ProviderName;
  taskType: TaskType;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface ProviderLimits {
  /** Limite diário de tokens (usa Infinity para ilimitado) */
  dailyTokens: number;
  /** Percentual de uso no qual o roteador troca de provider (0-100) */
  switchThresholdPct: number;
}

export interface ProviderStatus {
  name: ProviderName;
  /** Se a chave de API está configurada (ou Ollama está rodando) */
  available: boolean;
  usageToday: { tokens: number; requests: number };
  limits: ProviderLimits;
  /** Percentual atual do limite diário consumido */
  usagePct: number;
  /** Modelo preferido por tipo de tarefa */
  models: Record<TaskType, string>;
}
