// ─── LLM Router - Rastreamento de Uso ────────────────────────────────────────
// Persiste o consumo de tokens por provider/dia no SQLite local.
// Usado pelo roteador para decidir qual provider está próximo do limite.

import db from '../db.ts';
import type { ProviderName, TaskType } from './types.ts';

// Cria a tabela de uso se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS llm_usage (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    provider     TEXT    NOT NULL,
    model        TEXT    NOT NULL,
    task_type    TEXT    NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    latency_ms   INTEGER DEFAULT 0,
    success      INTEGER DEFAULT 1,
    error_msg    TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_llm_usage_provider_date
    ON llm_usage(provider, created_at);
`);

// ─────────────────────────────────────────────────────────────────────────────

export function recordUsage(params: {
  provider: ProviderName;
  model: string;
  taskType: TaskType;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  errorMsg?: string;
}) {
  db.prepare(`
    INSERT INTO llm_usage
      (provider, model, task_type, input_tokens, output_tokens, latency_ms, success, error_msg)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.provider,
    params.model,
    params.taskType,
    params.inputTokens,
    params.outputTokens,
    params.latencyMs,
    params.success ? 1 : 0,
    params.errorMsg ?? null,
  );
}

export function getDailyUsage(provider: ProviderName): { tokens: number; requests: number } {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
      COUNT(*) AS requests
    FROM llm_usage
    WHERE provider = ?
      AND date(created_at) = ?
      AND success = 1
  `).get(provider, today) as { tokens: number; requests: number };
  return { tokens: row.tokens, requests: row.requests };
}

/** Histórico agregado por provider/modelo/dia (padrão últimos 7 dias). */
export function getUsageHistory(days = 7) {
  return db.prepare(`
    SELECT
      provider,
      model,
      task_type,
      date(created_at)                            AS date,
      SUM(input_tokens + output_tokens)           AS total_tokens,
      SUM(input_tokens)                           AS input_tokens,
      SUM(output_tokens)                          AS output_tokens,
      COUNT(*)                                    AS requests,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS errors,
      ROUND(AVG(latency_ms))                      AS avg_latency_ms
    FROM llm_usage
    WHERE created_at >= datetime('now', ?)
    GROUP BY provider, model, task_type, date(created_at)
    ORDER BY date DESC, provider
  `).all(`-${days} days`);
}

/** Estatísticas consolidadas por provider (total histórico). */
export function getProviderStats() {
  return db.prepare(`
    SELECT
      provider,
      SUM(input_tokens + output_tokens) AS total_tokens,
      COUNT(*)                          AS total_requests,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS total_errors,
      ROUND(AVG(latency_ms))            AS avg_latency_ms,
      MIN(created_at)                   AS first_used,
      MAX(created_at)                   AS last_used
    FROM llm_usage
    GROUP BY provider
    ORDER BY total_tokens DESC
  `).all();
}
