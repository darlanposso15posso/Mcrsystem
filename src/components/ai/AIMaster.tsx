// ─── AI Master — Assistente Central ──────────────────────────────────────────
// Painel flutuante disponível em todas as telas do sistema.
// Age proativamente ao trocar de aba, sugerindo ações com base no contexto.
// Usa o LLM Router (Claude → Gemini → Ollama) automaticamente.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, ChevronDown, Cpu, Sparkles, Loader2, AlertCircle } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system-hint';
  content: string;
  provider?: string;
  model?: string;
  loading?: boolean;
}

interface AIMasterProps {
  activeTab: string;
  user: { name?: string; role?: string } | null;
  /** Dados de contexto do projeto atual (opcional) */
  context?: Record<string, unknown>;
}

// ─── Contexto por aba ─────────────────────────────────────────────────────────

const TAB_CONTEXT: Record<string, { label: string; systemPrompt: string; suggestion: string }> = {
  dashboard: {
    label: 'Dashboard',
    systemPrompt: 'Você é um assistente especialista em gestão de limpeza de coifas e sistemas de exaustão. O usuário está no Dashboard — ajude a interpretar métricas, identificar oportunidades e sugerir próximos passos estratégicos.',
    suggestion: 'Olá! Estou no Dashboard. Posso analisar suas métricas, identificar clientes que precisam de atenção ou sugerir ações prioritárias para hoje. O que gostaria de explorar?',
  },
  clients: {
    label: 'Clientes',
    systemPrompt: 'Você é um assistente especialista em gestão de clientes para serviços de limpeza de coifas. Ajude a organizar, priorizar e analisar a base de clientes.',
    suggestion: 'Estou na seção de Clientes. Posso ajudar a segmentar sua base, identificar clientes com serviços em atraso, sugerir scripts de contato ou criar um plano de retenção. Como posso ajudar?',
  },
  leads: {
    label: 'Leads',
    systemPrompt: 'Você é um assistente de vendas especializado em prospecção para serviços de limpeza de coifas. Ajude a qualificar leads, criar abordagens personalizadas e aumentar conversões.',
    suggestion: 'Estou nos Leads. Posso qualificar prospects, sugerir argumentos de vendas, criar scripts de abordagem ou analisar o funil de conversão. Quer começar?',
  },
  services: {
    label: 'Serviços',
    systemPrompt: 'Você é um assistente técnico especializado em serviços de limpeza de coifas e conformidade NFPA. Ajude com relatórios, checklists e otimização de processos técnicos.',
    suggestion: 'Estou no histórico de Serviços. Posso ajudar a gerar relatórios, analisar padrões de serviço, identificar irregularidades de conformidade NFPA ou otimizar rotas. O que precisa?',
  },
  calendar: {
    label: 'Calendário',
    systemPrompt: 'Você é um assistente de planejamento para agendamentos de serviços de limpeza de coifas. Ajude a otimizar rotas, evitar conflitos e maximizar produtividade.',
    suggestion: 'Estou no Calendário. Posso sugerir otimização de rotas por região, identificar buracos na agenda ou planejar o próximo mês de serviços. Como posso ajudar?',
  },
  team: {
    label: 'Equipe',
    systemPrompt: 'Você é um assistente de gestão de equipes para serviços técnicos. Ajude a distribuir tarefas, avaliar performance e desenvolver a equipe.',
    suggestion: 'Estou na gestão de Equipe. Posso sugerir distribuição de tarefas, criar métricas de performance ou ajudar a estruturar treinamentos técnicos. O que precisa?',
  },
  performance: {
    label: 'Performance',
    systemPrompt: 'Você é um analista de negócios especializado em KPIs para empresas de serviços de limpeza. Ajude a interpretar dados, identificar tendências e criar metas.',
    suggestion: 'Estou na Performance. Posso interpretar os KPIs, identificar gargalos de receita ou sugerir metas realistas para o próximo trimestre. Quer uma análise?',
  },
  automation: {
    label: 'Automação',
    systemPrompt: 'Você é um especialista em automação de processos para empresas de serviços. Ajude a configurar lembretes, fluxos automáticos e comunicações com clientes.',
    suggestion: 'Estou na Automação. Posso ajudar a configurar lembretes inteligentes, criar sequências de follow-up ou automatizar comunicações de renovação de contrato. Por onde começar?',
  },
  security: {
    label: 'Segurança',
    systemPrompt: 'Você é um especialista em segurança de dados e backup para pequenas empresas. Ajude a proteger informações críticas e garantir conformidade.',
    suggestion: 'Estou na Segurança. Posso sugerir uma política de backup, revisar práticas de segurança de dados ou criar um plano de recuperação. O que precisa?',
  },
};

const DEFAULT_CONTEXT = TAB_CONTEXT.dashboard;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function providerBadgeColor(provider?: string) {
  if (provider === 'claude')  return 'text-orange-400';
  if (provider === 'gemini')  return 'text-blue-400';
  if (provider === 'ollama')  return 'text-emerald-400';
  return 'text-slate-400';
}

function shortModel(model?: string) {
  if (!model) return '';
  return model.replace('claude-', '').replace('-4-6', '').replace('-4-5-20251001', '').replace('gemini-', '').replace('2.5-', '');
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AIMaster: React.FC<AIMasterProps> = ({ activeTab, user, context }) => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const prevTab   = useRef<string>('');

  const tabCtx = TAB_CONTEXT[activeTab] ?? DEFAULT_CONTEXT;

  // Rola para o final automaticamente
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Ao trocar de aba, insere sugestão proativa
  useEffect(() => {
    if (prevTab.current === activeTab) return;
    prevTab.current = activeTab;

    if (messages.length === 0 && !open) return; // painel fechado e sem histórico — não força abertura

    const hint: Message = {
      id: `hint-${Date.now()}`,
      role: 'system-hint',
      content: `📍 Você entrou em **${tabCtx.label}**`,
    };
    const suggestion: Message = {
      id: `sug-${Date.now()}`,
      role: 'assistant',
      content: tabCtx.suggestion,
      provider: 'system',
    };
    setMessages(prev => [...prev, hint, suggestion]);
  }, [activeTab]);

  // Primeira abertura do painel — mostra boas-vindas
  const handleOpen = useCallback(() => {
    setOpen(true);
    setMinimized(false);
    if (messages.length === 0) {
      const welcome: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Olá${user?.name ? `, ${user.name}` : ''}! Sou seu assistente mestre. Estou integrado ao roteador LLM (Claude → Gemini → Ollama) e posso ajudar com planejamento, código, análise de dados e qualquer tarefa do sistema.\n\n${tabCtx.suggestion}`,
        provider: 'system',
      };
      setMessages([welcome]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [messages.length, user, tabCtx]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    const loadingMsg: Message = { id: `l-${Date.now()}`, role: 'assistant', content: '', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      // Monta histórico para o router (exclui system-hints e mensagens de loading)
      const history = [...messages, userMsg]
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .filter(m => !m.loading)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: tabCtx.systemPrompt + (context ? `\n\nContexto adicional: ${JSON.stringify(context)}` : '') },
            ...history,
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? 'Erro desconhecido');
      }

      const data = await res.json();
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        provider: data.provider,
        model: data.model,
      };
      setMessages(prev => prev.filter(m => !m.loading).concat(reply));
    } catch (err: unknown) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Erro: ${err instanceof Error ? err.message : 'Falha ao conectar ao servidor LLM.'}`,
        provider: 'error',
      };
      setMessages(prev => prev.filter(m => !m.loading).concat(errMsg));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, tabCtx, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 right-5 z-[90] w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform blue-glow"
          title="Assistente IA Master"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Painel lateral */}
      {open && (
        <div className={`fixed bottom-0 right-0 z-[95] flex flex-col bg-[var(--sidebar-bg)] border-l border-t border-[var(--border-muted)] shadow-2xl transition-all duration-300
          ${minimized ? 'h-14 w-80' : 'h-[90vh] w-full sm:w-96'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--card-color)] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent-primary)]" />
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">AI Master</span>
              <span className="text-xs text-slate-500 ml-1">· {tabCtx.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(v => !v)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <ChevronDown size={16} className={`transition-transform ${minimized ? 'rotate-180' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Mensagens */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id}>
                    {msg.role === 'system-hint' ? (
                      <div className="text-center">
                        <span className="text-xs text-slate-500 bg-[var(--card-color)] px-2 py-0.5 rounded-full border border-[var(--border-muted)]">
                          {msg.content}
                        </span>
                      </div>
                    ) : msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-[var(--accent-primary)] text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className={`max-w-[90%] text-sm px-3 py-2 rounded-2xl rounded-tl-sm border
                          ${msg.provider === 'error'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-[var(--card-color)] border-[var(--border-muted)] text-[var(--text-primary)]'
                          }`}
                        >
                          {msg.loading ? (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Loader2 size={14} className="animate-spin" />
                              <span>Pensando...</span>
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                          )}
                        </div>
                        {msg.provider && msg.provider !== 'system' && msg.provider !== 'error' && (
                          <div className={`flex items-center gap-1 ml-1 ${providerBadgeColor(msg.provider)}`}>
                            <Cpu size={10} />
                            <span className="text-[10px] font-mono">{msg.provider}/{shortModel(msg.model)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sugestões rápidas */}
              <div className="px-3 pb-2 flex gap-2 overflow-x-auto shrink-0">
                {['Analise a situação atual', 'Quais são as prioridades?', 'Crie um plano de ação'].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-[10px] whitespace-nowrap px-2 py-1 rounded-full border border-[var(--border-muted)] text-slate-400 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[var(--border-muted)] shrink-0">
                <div className="flex gap-2 items-end bg-[var(--card-color)] border border-[var(--border-muted)] rounded-xl p-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte algo ou descreva uma tarefa..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-slate-500 resize-none outline-none leading-5 max-h-32"
                    style={{ height: 'auto' }}
                    onInput={e => {
                      const t = e.currentTarget;
                      t.style.height = 'auto';
                      t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="p-1.5 rounded-lg bg-[var(--accent-primary)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity shrink-0"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 text-center">Enter para enviar · Shift+Enter nova linha</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIMaster;
