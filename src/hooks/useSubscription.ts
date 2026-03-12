// ─── useSubscription ──────────────────────────────────────────────────────────
// Reads the company's subscription state from Supabase and exposes helpers
// for limit checks, trial countdown, and Stripe actions.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getPlan, isAtLimit, usagePct, TRIAL_DAYS, type PlanId } from '../lib/plans';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface SubscriptionState {
  planId: PlanId;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  maxClients: number;
  maxTechnicians: number;
  /** Days left in trial (null if not in trial) */
  trialDaysLeft: number | null;
  /** True when trial has expired AND no active subscription */
  isBlocked: boolean;
  /** Warning when >= 80% of a limit is used */
  clientWarning: boolean;
  technicianWarning: boolean;
  /** Check before adding a client; returns false if at limit */
  canAddClient: (currentCount: number) => boolean;
  /** Check before adding a technician; returns false if at limit */
  canAddTechnician: (currentCount: number) => boolean;
  clientUsagePct: (currentCount: number) => number;
  technicianUsagePct: (currentCount: number) => number;
  /** Refresh subscription from DB */
  refresh: () => Promise<void>;
  loading: boolean;
}

const DEFAULT: SubscriptionState = {
  planId: 'trial',
  status: 'trial',
  trialEndsAt: null,
  periodEndsAt: null,
  maxClients: 20,
  maxTechnicians: 2,
  trialDaysLeft: TRIAL_DAYS,
  isBlocked: false,
  clientWarning: false,
  technicianWarning: false,
  canAddClient: () => true,
  canAddTechnician: () => true,
  clientUsagePct: () => 0,
  technicianUsagePct: () => 0,
  refresh: async () => {},
  loading: true,
};

export function useSubscription(
  companyId: string | null | undefined,
  clientCount: number,
  technicianCount: number,
): SubscriptionState {
  const [state, setState] = useState<Omit<SubscriptionState, 'canAddClient' | 'canAddTechnician' | 'clientUsagePct' | 'technicianUsagePct' | 'refresh'>>(
    { ...DEFAULT }
  );

  const fetchSubscription = useCallback(async () => {
    if (!companyId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data } = await supabase
        .from('companies')
        .select('subscription_status, plan_id, trial_ends_at, subscription_period_end')
        .eq('id', companyId)
        .maybeSingle();

      const planId: PlanId = (data?.plan_id as PlanId) ?? 'trial';
      const plan = getPlan(planId);
      const rawStatus: SubscriptionStatus = (data?.subscription_status as SubscriptionStatus) ?? 'trial';
      const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const periodEndsAt = data?.subscription_period_end ? new Date(data.subscription_period_end) : null;

      // Calculate trial days left
      let trialDaysLeft: number | null = null;
      if (rawStatus === 'trial' && trialEndsAt) {
        const diff = trialEndsAt.getTime() - Date.now();
        trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      // Determine if access should be blocked
      const trialExpired = rawStatus === 'trial' && trialEndsAt && trialEndsAt < new Date();
      const status: SubscriptionStatus = trialExpired ? 'expired' : rawStatus;
      const isBlocked = status === 'expired' || status === 'canceled';

      const clientWarning = usagePct(clientCount, plan.maxClients) >= 80;
      const technicianWarning = usagePct(technicianCount, plan.maxTechnicians) >= 80;

      setState({
        planId,
        status,
        trialEndsAt,
        periodEndsAt,
        maxClients: plan.maxClients,
        maxTechnicians: plan.maxTechnicians,
        trialDaysLeft,
        isBlocked,
        clientWarning,
        technicianWarning,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [companyId, clientCount, technicianCount]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canAddClient = useCallback(
    (currentCount: number) => !isAtLimit(currentCount, state.maxClients),
    [state.maxClients],
  );

  const canAddTechnician = useCallback(
    (currentCount: number) => !isAtLimit(currentCount, state.maxTechnicians),
    [state.maxTechnicians],
  );

  const clientUsagePctFn = useCallback(
    (count: number) => usagePct(count, state.maxClients),
    [state.maxClients],
  );

  const technicianUsagePctFn = useCallback(
    (count: number) => usagePct(count, state.maxTechnicians),
    [state.maxTechnicians],
  );

  return {
    ...state,
    canAddClient,
    canAddTechnician,
    clientUsagePct: clientUsagePctFn,
    technicianUsagePct: technicianUsagePctFn,
    refresh: fetchSubscription,
  };
}
