// ─── UpgradeModal ─────────────────────────────────────────────────────────────
// Shown when the user hits a plan limit or the trial expires.
// Displays all available plans and redirects to Stripe Checkout.

import React, { useState } from 'react';
import { X, Check, Zap, AlertTriangle, Crown, Star, Rocket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PLANS, PLAN_ORDER, type PlanId } from '../../lib/plans';

interface UpgradeModalProps {
  reason: 'client_limit' | 'technician_limit' | 'trial_expired' | 'manual';
  companyId: string;
  currentPlanId: PlanId;
  onClose: () => void;
}

const REASON_MESSAGES = {
  client_limit:      { title: 'Limite de Clientes Atingido', icon: <AlertTriangle size={22} className="text-amber-400" />, msg: 'Você atingiu o máximo de clientes do seu plano atual. Faça upgrade para continuar cadastrando.' },
  technician_limit:  { title: 'Limite de Técnicos Atingido', icon: <AlertTriangle size={22} className="text-amber-400" />, msg: 'Você atingiu o máximo de técnicos do seu plano atual. Faça upgrade para adicionar mais membros à equipe.' },
  trial_expired:     { title: 'Seu Trial Expirou', icon: <Crown size={22} className="text-yellow-400" />, msg: 'Seus 30 dias de trial gratuito terminaram. Escolha um plano para continuar usando o MCR System.' },
  manual:            { title: 'Faça Upgrade do seu Plano', icon: <Star size={22} className="text-emerald-400" />, msg: 'Escolha o plano ideal para o seu negócio e desbloqueie mais capacidade.' },
};

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  trial:      <Zap size={18} />,
  starter:    <Rocket size={18} />,
  growth:     <Star size={18} />,
  pro:        <Crown size={18} />,
  enterprise: <Crown size={18} className="text-yellow-400" />,
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ reason, companyId, currentPlanId, onClose }) => {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const info = REASON_MESSAGES[reason];

  const handleCheckout = async (planId: PlanId) => {
    const plan = PLANS[planId];
    if (!plan.stripePriceId) return;

    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.stripePriceId,
          companyId,
          planId,
          successUrl: `${window.location.origin}/?checkout=success&plan=${planId}`,
          cancelUrl: `${window.location.origin}/?checkout=canceled`,
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const paidPlans = PLAN_ORDER.filter(id => id !== 'trial');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            {info.icon}
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{info.title}</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-lg">{info.msg}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Plans grid */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paidPlans.map(planId => {
            const plan = PLANS[planId];
            const isCurrent = planId === currentPlanId;
            const isLoading = loadingPlan === planId;
            const colorMap: Record<string, string> = {
              blue: 'border-blue-500/40 hover:border-blue-500/80',
              emerald: 'border-emerald-500/40 hover:border-emerald-500/80',
              purple: 'border-purple-500/40 hover:border-purple-500/80',
              orange: 'border-orange-500/40 hover:border-orange-500/80',
            };
            const btnColorMap: Record<string, string> = {
              blue: 'bg-blue-600 hover:bg-blue-500',
              emerald: 'bg-emerald-600 hover:bg-emerald-500',
              purple: 'bg-purple-600 hover:bg-purple-500',
              orange: 'bg-orange-600 hover:bg-orange-500',
            };

            return (
              <div
                key={planId}
                className={`relative bg-slate-800/60 border-2 rounded-2xl p-6 flex flex-col transition-all duration-300 ${
                  plan.popular ? colorMap[plan.color] + ' scale-[1.02]' : colorMap[plan.color]
                } ${isCurrent ? 'opacity-50' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${plan.color}-500 text-slate-950`}>
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4 text-white">
                  {PLAN_ICONS[planId]}
                  <span className="font-black uppercase tracking-widest text-sm">{plan.name}</span>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 text-xs font-bold">/mês</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1 text-sm">
                  {[
                    `${plan.maxClients} clientes ativos`,
                    `${plan.maxTechnicians} técnico${plan.maxTechnicians > 1 ? 's' : ''}`,
                    'Emissão de relatórios',
                    'Conformidade NFPA',
                    'Suporte por email',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(planId)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed ${btnColorMap[plan.color]}`}
                >
                  {isLoading ? 'Aguarde...' : isCurrent ? 'Plano Atual' : 'Assinar Agora'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest pb-8">
          Pagamento seguro via Stripe • Cancele a qualquer momento
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;
