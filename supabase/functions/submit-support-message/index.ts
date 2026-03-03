import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitSupportMessageRequest {
  nome: string;
  matricula: number | null;
  matriculaDesconhecida: boolean;
  email: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  mensagem: string;
  origem: "LOGIN_MODAL" | "CONTACT_PAGE" | "ASSOCIADO_PORTAL" | "ADMIN_INTERNO" | "ADMIN_ASSOCIADO";
}

const NOTIFY_API_URL = Deno.env.get("NOTIFY_API_URL") || "https://api.seellbr.com";
const WHATSAPP_API_URL =
  Deno.env.get("WHATSAPP_API_URL") || `${NOTIFY_API_URL.replace(/\/$/, "")}/whatsapp/send`;
const EMAIL_API_URL =
  Deno.env.get("EMAIL_API_URL") || "https://api.seellbr.com/whatsapp/email/send";

const normalizeDigits = (value: string) => (value || "").replace(/\D/g, "");

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildWhatsappMessage = (payload: SubmitSupportMessageRequest, occurrenceCode: string) => {
  const matriculaText = payload.matriculaDesconhecida
    ? "Desconhecido/Não possui"
    : String(payload.matricula ?? "");

  return [
    "Nova mensagem interna - FUNSEP",
    `Origem: ${
      payload.origem === "CONTACT_PAGE"
        ? "Localização e Contato"
        : payload.origem === "ASSOCIADO_PORTAL"
          ? "Portal do Associado"
          : "Modal de Login"
    }`,
    `Nome: ${payload.nome}`,
    `Matrícula: ${matriculaText}`,
    `Email: ${payload.email}`,
    `CPF: ${payload.cpf}`,
    `Data nascimento: ${payload.dataNascimento}`,
    `Telefone: ${payload.telefone}`,
    `Mensagem: ${payload.mensagem}`,
    `Ocorrência: ${occurrenceCode}`,
  ].join("\n");
};

const sendReceivedEmail = async (to: string, name: string, occurrenceCode: string) => {
  const subject = `Recebemos sua ocorrência ${occurrenceCode}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="margin:0 0 12px 0;color:#2563eb">FUNSEP - Ocorrência recebida</h2>
      <p>Olá, <strong>${name}</strong>.</p>
      <p>Recebemos sua ocorrência <strong>${occurrenceCode}</strong> com sucesso.</p>
      <p>Nossa equipe analisará e retornará o mais breve possível.</p>
      <p style="margin-top:16px;font-size:12px;color:#6b7280">Este é um e-mail automático.</p>
    </div>
  `;

  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      text: `Olá, ${name}. Recebemos sua ocorrência ${occurrenceCode} e retornaremos em breve.`,
      html,
    }),
  });

  const txt = await response.text();
  console.log("sendReceivedEmail:", response.status, txt);
  if (!response.ok) {
    throw new Error(`Falha no envio do e-mail de confirmação: ${response.status} ${txt}`);
  }
};

const normalizePhone = (value: string) => {
  let digits = normalizeDigits(value);
  if (!digits) return null;
  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits[2] === "9") {
    digits = digits.slice(0, 2) + digits.slice(3);
  }
  return `55${digits}`;
};

const fetchWhatsappRecipients = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("sigla, nome, telefone, cpf, status")
    .eq("status", "ATIVO")
    .not("cpf", "is", null)
    .not("cpf", "eq", "")
    .not("telefone", "is", null)
    .not("telefone", "eq", "");

  if (error) {
    throw new Error(`Erro ao buscar destinatários WhatsApp: ${error.message}`);
  }

  return (data || []) as Array<{
    sigla: string | null;
    nome: string | null;
    telefone: string | null;
    cpf: string | null;
    status: string | null;
  }>;
};

const sendWhatsappNotifications = async (
  supabase: ReturnType<typeof createClient>,
  message: string
) => {
  const recipients = await fetchWhatsappRecipients(supabase);

  for (const recipient of recipients) {
    const normalizedPhone = normalizePhone(recipient.telefone || "");
    if (!normalizedPhone) continue;

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        message,
      }),
    });

    const responseText = await response.text();
    console.log("WhatsApp notify:", {
      sigla: recipient.sigla,
      nome: recipient.nome,
      normalizedPhone,
      endpoint: WHATSAPP_API_URL,
      status: response.status,
      response: responseText,
    });

    if (!response.ok) {
      throw new Error(`Falha ao notificar ${recipient.sigla || recipient.nome || normalizedPhone}: ${response.status} ${responseText}`);
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = (await req.json()) as SubmitSupportMessageRequest;

    const nome = (body.nome || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const cpf = normalizeDigits(body.cpf).slice(0, 11);
    const telefone = normalizeDigits(body.telefone).slice(0, 11);
    const mensagem = (body.mensagem || "").trim();
    const dataNascimento = (body.dataNascimento || "").trim();
    const matricula = body.matriculaDesconhecida ? null : body.matricula;
    const origem =
      body.origem === "CONTACT_PAGE"
        ? "CONTACT_PAGE"
        : body.origem === "ASSOCIADO_PORTAL"
          ? "ASSOCIADO_PORTAL"
          : "LOGIN_MODAL";

    if (!nome) {
      return new Response(
        JSON.stringify({ success: false, error: "Nome é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body.matriculaDesconhecida && (!matricula || Number(matricula) <= 0)) {
      return new Response(
        JSON.stringify({ success: false, error: "Matrícula é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (cpf.length !== 11) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!dataNascimento) {
      return new Response(
        JSON.stringify({ success: false, error: "Data de nascimento é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (telefone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Telefone inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!mensagem) {
      return new Response(
        JSON.stringify({ success: false, error: "Mensagem é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("support_messages")
      .insert({
        nome,
        matricula,
        matricula_desconhecida: Boolean(body.matriculaDesconhecida),
        email,
        cpf,
        data_nascimento: dataNascimento,
        telefone,
        mensagem,
        origem,
        awaiting_party: "EQUIPE",
        last_sender_tipo: "ASSOCIADO",
        last_sender_sigla: null,
        last_interaction_at: new Date().toISOString(),
      })
      .select("id, occurrence_code, nome, email")
      .single();

    if (insertError) {
      console.error("Erro ao inserir support_messages:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível salvar sua mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const occurrenceCode = inserted?.occurrence_code || "E000000000";

    try {
      await sendReceivedEmail(email, nome, occurrenceCode);
    } catch (emailError) {
      console.error("Erro no envio de e-mail automático de recebimento:", emailError);
    }

    try {
      await sendWhatsappNotifications(
        supabase,
        buildWhatsappMessage({
          nome,
          matricula,
          matriculaDesconhecida: Boolean(body.matriculaDesconhecida),
          email,
          cpf,
          dataNascimento,
          telefone,
          mensagem,
          origem,
        }, occurrenceCode),
      );
    } catch (notifyError) {
      console.error("Erro no envio de WhatsApp:", notifyError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro ao processar submit-support-message:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
