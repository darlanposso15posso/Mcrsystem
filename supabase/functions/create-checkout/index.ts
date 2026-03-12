// @ts-nocheck
// ─── create-checkout ──────────────────────────────────────────────────────────
// Creates a Stripe Checkout Session and returns the redirect URL.
// Called from UpgradeModal.tsx via supabase.functions.invoke('create-checkout').

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { priceId, companyId, planId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !companyId) {
      return new Response(JSON.stringify({ error: "Missing priceId or companyId" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Get or create Stripe customer for this company
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id, name, email")
      .eq("id", companyId)
      .maybeSingle();

    let customerId: string = company?.stripe_customer_id ?? "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: company?.name ?? "MCR Customer",
        email: company?.email ?? undefined,
        metadata: { companyId },
      });
      customerId = customer.id;
      await supabase
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${req.headers.get("origin")}/?checkout=success`,
      cancel_url: cancelUrl ?? `${req.headers.get("origin")}/?checkout=canceled`,
      metadata: { companyId, planId: planId ?? "" },
      subscription_data: { metadata: { companyId, planId: planId ?? "" } },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
