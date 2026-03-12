// @ts-nocheck
// ─── create-portal ────────────────────────────────────────────────────────────
// Creates a Stripe Billing Portal session so customers can manage their subscription.
// Called from BillingPage.tsx via supabase.functions.invoke('create-portal').

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
    const { companyId, returnUrl } = await req.json();

    if (!companyId) {
      return new Response(JSON.stringify({ error: "Missing companyId" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id")
      .eq("id", companyId)
      .maybeSingle();

    if (!company?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No Stripe customer found for this company" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: returnUrl ?? `${req.headers.get("origin")}/`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-portal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
