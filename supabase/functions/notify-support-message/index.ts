import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationType = "RECEIVED" | "REPLY";

interface NotifySupportMessageRequest {
  supportMessageId: string;
  notificationType: NotificationType;
  replyPreview?: string;
  responderName?: string;
}

const EMAIL_API_URL =
  Deno.env.get("EMAIL_API_URL") || "https://api.seellbr.com/whatsapp/email/send";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html, text }),
  });

  const responseText = await response.text();
  console.log("notify-support-message email response:", response.status, responseText);
  if (!response.ok) {
    throw new Error(`Falha ao enviar email: ${response.status} ${responseText}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as NotifySupportMessageRequest;
    const supportMessageId = String(body.supportMessageId || "").trim();
    const notificationType = body.notificationType;

    if (!supportMessageId) {
      return new Response(
        JSON.stringify({ success: false, error: "supportMessageId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (notificationType !== "RECEIVED" && notificationType !== "REPLY") {
      return new Response(
        JSON.stringify({ success: false, error: "notificationType inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: message, error } = await supabase
      .from("support_messages")
      .select("id, occurrence_code, nome, email, origem, mensagem")
      .eq("id", supportMessageId)
      .maybeSingle();

    if (error || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Ocorrência não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toEmail = String(message.email || "").trim().toLowerCase();
    if (!toEmail) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Sem e-mail na ocorrência" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const protocolo = message.occurrence_code || "sem-codigo";
    const nome = escapeHtml(String(message.nome || "usuário"));

    let subject = "";
    let html = "";
    let text = "";

    if (notificationType === "RECEIVED") {
      subject = `Recebemos sua ocorrência ${protocolo}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
          <h2 style="margin:0 0 12px 0;color:#2563eb">FUNSEP - Ocorrência recebida</h2>
          <p>Olá, <strong>${nome}</strong>.</p>
          <p>Recebemos sua ocorrência <strong>${protocolo}</strong> com sucesso.</p>
          <p>Nossa equipe analisará o seu relato e retornará o mais breve possível.</p>
          <p style="margin-top:16px;font-size:12px;color:#6b7280">Este é um e-mail automático.</p>
        </div>
      `;
      text = `Olá, ${message.nome}. Recebemos sua ocorrência ${protocolo} e em breve retornaremos.`;
    } else {
      const responder = escapeHtml(String(body.responderName || "Equipe FUNSEP"));
      const preview = escapeHtml(String(body.replyPreview || "").slice(0, 400));
      subject = `Nova resposta na ocorrência ${protocolo}`;
      html = `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
          <h2 style="margin:0 0 12px 0;color:#2563eb">FUNSEP - Nova resposta</h2>
          <p>Olá, <strong>${nome}</strong>.</p>
          <p>Sua ocorrência <strong>${protocolo}</strong> recebeu uma nova resposta de <strong>${responder}</strong>.</p>
          ${preview ? `<div style="background:#f3f4f6;border-radius:8px;padding:10px;margin-top:10px"><strong>Prévia:</strong><br/>${preview}</div>` : ""}
          <p style="margin-top:16px;font-size:12px;color:#6b7280">Este é um e-mail automático.</p>
        </div>
      `;
      text = `Sua ocorrência ${protocolo} recebeu uma nova resposta de ${body.responderName || "Equipe FUNSEP"}.`;
    }

    await sendEmail(toEmail, subject, html, text);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro em notify-support-message:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
