// @ts-nocheck
// ─── stripe-webhook ───────────────────────────────────────────────────────────
// Handles Stripe webhook events and updates the companies table accordingly.
// Configure in Stripe Dashboard: Webhook endpoint → /functions/v1/stripe-webhook
// Events to listen: checkout.session.completed, customer.subscription.updated,
//                   customer.subscription.deleted, invoice.payment_failed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error: " + String(err), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const updateCompany = async (companyId: string, patch: Record<string, unknown>) => {
    if (!companyId) return;
    await supabase.from("companies").update(patch).eq("id", companyId);
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyId = session.metadata?.companyId ?? "";
      const planId = session.metadata?.planId ?? "starter";
      const sub = typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription as Stripe.Subscription;

      await updateCompany(companyId, {
        subscription_status: "active",
        plan_id: planId,
        stripe_subscription_id: sub?.id ?? null,
        subscription_period_end: sub?.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.companyId ?? "";
      const planId = sub.metadata?.planId ?? "";
      const status = sub.status === "active" ? "active"
        : sub.status === "past_due" ? "past_due"
        : sub.status === "canceled" ? "canceled"
        : "active";

      await updateCompany(companyId, {
        subscription_status: status,
        plan_id: planId || undefined,
        subscription_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.companyId ?? "";
      await updateCompany(companyId, {
        subscription_status: "canceled",
        stripe_subscription_id: null,
        subscription_period_end: null,
      });
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = invoice.customer as string;
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", customer)
        .maybeSingle();
      if (company?.id) {
        await updateCompany(company.id, {
          subscription_status: "active",
          subscription_period_end: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = invoice.customer as string;
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("stripe_customer_id", customer)
        .maybeSingle();
      if (company?.id) {
        await updateCompany(company.id, { subscription_status: "past_due" });
      }
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
