// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const { technicianName, technicianEmail, technicianPhone } = await req.json();

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "MCR Notifications <onboarding@resend.dev>",
                to: ["dehoodcleaning@gmail.com"],
                subject: `Novo técnico solicitou acesso: ${technicianName}`,
                html: `
          <h2>Novo Cadastro Pendente</h2>
          <p>Um novo técnico acabou de criar uma conta pelo aplicativo e aguarda liberação/aprovação do acesso.</p>
          <ul>
            <li><strong>Nome:</strong> ${technicianName}</li>
            <li><strong>E-mail:</strong> ${technicianEmail}</li>
            <li><strong>Telefone:</strong> ${technicianPhone}</li>
          </ul>
          <br/>
          <p>Acesse o painel do Supabase (Auth > Users) para verificar.</p>
        `,
            }),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
});
