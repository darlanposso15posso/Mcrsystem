// ─── BillingPage ──────────────────────────────────────────────────────────────
// Shows current plan, usage, limits and a button to manage billing via Stripe.

import React, { useState } from 'react';
import { CreditCard, Users, Building2, Shield, Zap, AlertTriangle, CheckCircle2, Crown, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PLANS, getPlan, usagePct, type PlanId } from '../../lib/plans';
import type { SubscriptionState } from '../../hooks/useSubscription';
import UpgradeModal from './UpgradeModal';

interface BillingPageProps {
  subscription: SubscriptionState;
  companyId: string;
  clientCount: number;
  technicianCount: number;
  companyName: string;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  subscription, companyId, clientCount, technicianCount, companyName,
}) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const plan = getPlan(subscription.planId);

  const clientPct   = usagePct(clientCount, subscription.maxClients);
  const techPct     = usagePct(technicianCount, subscription.maxTechnicians);

  const handleBillingPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal', {
        body: { companyId, returnUrl: window.location.href },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      alert('Erro ao abrir portal de pagamento. Tente novamente.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    trial:     { label: 'Trial Ativo',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    active:    { label: 'Assinatura Ativa',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    past_due:  { label: 'Pagamento Pendente',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    canceled:  { label: 'Cancelado',           color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    expired:   { label: 'Trial Expirado',      color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  };

  const { label, color } = statusLabel[subscription.status] ?? statusLabel.trial;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Assinatura & Plano</h1>
          <p className="text-slate-400 text-sm mt-1">{companyName}</p>
        </div>
        <button
          onClick={() => subscription.refresh()}
          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Trial / Expiry Banner */}
      {subscription.status === 'trial' && subscription.trialDaysLeft !== null && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          subscription.trialDaysLeft <= 7
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {subscription.trialDaysLeft <= 7 ? <AlertTriangle size={18} /> : <Zap size={18} />}
          <span className="font-bold text-sm">
            {subscription.trialDaysLeft === 0
              ? 'Seu trial expira hoje!'
              : `Seu trial expira em ${subscription.trialDaysLeft} dia${subscription.trialDaysLeft !== 1 ? 's' : ''}.`}
            {' '}Faça upgrade para não perder o acesso.
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="ml-auto px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Upgrade
          </button>
        </div>
      )}

      {(subscription.status === 'expired' || subscription.status === 'canceled') && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400">
          <AlertTriangle size={18} />
          <span className="font-bold text-sm">
            {subscription.status === 'expired' ? 'Trial expirado.' : 'Assinatura cancelada.'}
            {' '}Escolha um plano para reativar o acesso ao sistema.
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="ml-auto px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Reativar
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Crown size={22} />
            </div>
            <div>
              <h2 className="font-black text-white uppercase text-lg">{plan.name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mt-1 ${color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {label}
              </span>
            </div>
          </div>
          <div className="text-right">
            {plan.price > 0 ? (
              <>
                <span className="text-3xl font-black text-white">${plan.price}</span>
                <span className="text-slate-500 text-xs">/mês</span>
              </>
            ) : (
              <span className="text-emerald-400 font-black text-lg">Grátis</span>
            )}
          </div>
        </div>

        {subscription.periodEndsAt && subscription.status === 'active' && (
          <p className="text-slate-500 text-xs mb-4">
            Próxima renovação: {subscription.periodEndsAt.toLocaleDateString('pt-BR')}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {subscription.status === 'trial' || subscription.status === 'expired' ? (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <Zap size={14} /> Fazer Upgrade
            </button>
          ) : (
            <button
              onClick={handleBillingPortal}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <CreditCard size={14} />
              {loadingPortal ? 'Abrindo...' : 'Gerenciar Assinatura'}
            </button>
          )}
          {subscription.planId !== 'enterprise' && subscription.status === 'active' && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <Crown size={14} /> Ver Planos Superiores
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Clients */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-widest">
              <Building2 size={16} className="text-emerald-500" /> Clientes
            </div>
            <span className={`text-sm font-black ${clientPct >= 100 ? 'text-red-400' : clientPct >= 80 ? 'text-amber-400' : 'text-slate-400'}`}>
              {clientCount} / {subscription.maxClients}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${clientPct >= 100 ? 'bg-red-500' : clientPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, clientPct)}%` }}
            />
          </div>
          {clientPct >= 80 && (
            <p className="text-xs text-amber-400 mt-2 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> {clientPct >= 100 ? 'Limite atingido!' : `${clientPct}% usado — quase no limite`}
            </p>
          )}
        </div>

        {/* Technicians */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-widest">
              <Users size={16} className="text-blue-500" /> Técnicos
            </div>
            <span className={`text-sm font-black ${techPct >= 100 ? 'text-red-400' : techPct >= 80 ? 'text-amber-400' : 'text-slate-400'}`}>
              {technicianCount} / {subscription.maxTechnicians}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${techPct >= 100 ? 'bg-red-500' : techPct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, techPct)}%` }}
            />
          </div>
          {techPct >= 80 && (
            <p className="text-xs text-amber-400 mt-2 font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> {techPct >= 100 ? 'Limite atingido!' : `${techPct}% usado — quase no limite`}
            </p>
          )}
        </div>
      </div>

      {/* Features included */}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6">
        <h3 className="font-black text-white text-sm uppercase tracking-widest mb-4">Incluído no seu plano</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Emissão de Relatórios PDF',
            'Conformidade NFPA 96',
            'Calendário de Agendamentos',
            'Gestão de Técnicos',
            'CRM de Clientes',
            'Histórico de Serviços',
            'Automação de Lembretes',
            'Assistente IA (MCR AI)',
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-white/5 text-slate-500 text-xs">
        <Shield size={16} className="shrink-0" />
        Pagamentos processados com segurança pela Stripe. Seus dados de cartão nunca são armazenados em nossos servidores.
      </div>

      {showUpgrade && (
        <UpgradeModal
          reason="manual"
          companyId={companyId}
          currentPlanId={subscription.planId}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

export default BillingPage;
