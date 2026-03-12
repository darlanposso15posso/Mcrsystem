// ─── SaaS Plans — MCR Platform ────────────────────────────────────────────────

export type PlanId = 'trial' | 'starter' | 'growth' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;          // USD/month (0 = free trial)
  maxClients: number;
  maxTechnicians: number;
  stripePriceId: string | null;
  popular?: boolean;
  color: string;
  badge?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: 'trial',
    name: 'Trial Grátis',
    price: 0,
    maxClients: 20,
    maxTechnicians: 2,
    stripePriceId: null,
    color: 'emerald',
    badge: '30 dias',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 12,
    maxClients: 15,
    maxTechnicians: 1,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_STARTER ?? null,
    color: 'blue',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 19,
    maxClients: 25,
    maxTechnicians: 2,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_GROWTH ?? null,
    popular: true,
    color: 'emerald',
    badge: 'Mais Popular',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    maxClients: 50,
    maxTechnicians: 3,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO ?? null,
    color: 'purple',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 69,
    maxClients: 150,
    maxTechnicians: 7,
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE ?? null,
    color: 'orange',
    badge: 'Melhor Valor',
  },
};

export const PLAN_ORDER: PlanId[] = ['trial', 'starter', 'growth', 'pro', 'enterprise'];

export const TRIAL_DAYS = 30;

/** Returns the plan object for a given planId, defaulting to trial */
export function getPlan(planId?: string | null): Plan {
  return PLANS[(planId as PlanId) ?? 'trial'] ?? PLANS.trial;
}

/** Returns true if the current count is at or above the plan limit */
export function isAtLimit(current: number, max: number): boolean {
  return current >= max;
}

/** Returns % used of a limit (0-100) */
export function usagePct(current: number, max: number): number {
  return Math.min(100, Math.round((current / max) * 100));
}
