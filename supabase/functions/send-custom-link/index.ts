import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCustomLinkRequest {
  matricula?: number;
  cpf?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  mensagem?: string;
  canal: "EMAIL" | "WHATSAPP" | "AMBOS";
}

interface Beneficiario {
  matricula: number;
  nome: string;
  cpf: number | null;
  email: string | null;
  telefone: string | null;
  telefone1: string | null;
}

const EMAIL_API_URL =
  Deno.env.get("EMAIL_API_URL") || "https://api.seellbr.com/whatsapp/email/send";
const NOTIFY_API_URL = Deno.env.get("NOTIFY_API_URL") || "https://api.seellbr.com";
const WHATSAPP_API_URL =
  Deno.env.get("WHATSAPP_API_URL") || `${NOTIFY_API_URL.replace(/\/$/, "")}/whatsapp/send`;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://funsep.com.br";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeDigits = (value: string) => (value || "").replace(/\D/g, "");

const normalizeCpf = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(11, "0").slice(-11);
};

const cpfVariants = (value: string | number | null | undefined): string[] => {
  const normalized = normalizeCpf(value);
  if (!normalized) return [];

  const compact = normalized.replace(/^0+/, "") || "0";
  if (compact === normalized) return [normalized];

  return [normalized, compact];
};

const normalizePhone = (value: string) => {
  let digits = normalizeDigits(value);
  if (!digits) return "";

  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits[2] === "9") {
    digits = digits.slice(0, 2) + digits.slice(3);
  }
  return `55${digits}`;
};

const formatCpf = (value: string | number | null | undefined) => {
  const digits = normalizeCpf(value);
  if (!digits) return "-";
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toHtmlParagraphs = (value: string) =>
  escapeHtml(value || "").replace(/\n/g, "<br/>");

const DEFAULT_OPENING = "Olá associado FUNSEP, segue sua resposta referente à ocorrência.";

const stripDefaultOpening = (value: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return "";

  const compact = normalized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const compactDefault = DEFAULT_OPENING
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (compact.startsWith(compactDefault)) {
    return normalized.slice(DEFAULT_OPENING.length).trim().replace(/^[\s:,-]+/, "").trim();
  }

  return normalized;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as SendCustomLinkRequest;
    const canal = body.canal;
    const mensagemPersonalizada = String(body.mensagem || "").trim() || DEFAULT_OPENING;

    if (!["EMAIL", "WHATSAPP", "AMBOS"].includes(canal)) {
      return new Response(
        JSON.stringify({ success: false, error: "Canal inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const matricula = Number(body.matricula || 0);
    const cpfInput = normalizeCpf(body.cpf);
    const emailInput = String(body.email || "").trim().toLowerCase();

    let beneficiario: Beneficiario | null = null;

    if (matricula > 0) {
      const { data, error } = await supabase
        .from("cadben")
        .select("matricula, nome, cpf, email, telefone, telefone1")
        .eq("matricula", matricula)
        .maybeSingle();
      if (error) throw new Error(`Erro ao buscar associado por matrícula: ${error.message}`);
      beneficiario = data as Beneficiario | null;
    } else if (cpfInput.length === 11) {
      const { data, error } = await supabase
        .from("cadben")
        .select("matricula, nome, cpf, email, telefone, telefone1")
        .eq("cpf", parseInt(cpfInput, 10))
        .maybeSingle();
      if (error) throw new Error(`Erro ao buscar associado por CPF: ${error.message}`);
      beneficiario = data as Beneficiario | null;
    } else if (isValidEmail(emailInput)) {
      const { data, error } = await supabase
        .from("cadben")
        .select("matricula, nome, cpf, email, telefone, telefone1")
        .eq("email", emailInput)
        .maybeSingle();
      if (error) throw new Error(`Erro ao buscar associado por e-mail: ${error.message}`);
      beneficiario = data as Beneficiario | null;
    }

    if (!beneficiario) {
      return new Response(
        JSON.stringify({ success: false, error: "Associado não encontrado para gerar o link." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nome = String(body.nome || beneficiario.nome || "Associado").trim();
    const email = String(body.email || beneficiario.email || "").trim().toLowerCase();
    const telefone = normalizePhone(
      String(body.telefone || beneficiario.telefone || beneficiario.telefone1 || ""),
    );

    if ((canal === "EMAIL" || canal === "AMBOS") && !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "E-mail inválido para envio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if ((canal === "WHATSAPP" || canal === "AMBOS") && telefone.length < 12) {
      return new Response(
        JSON.stringify({ success: false, error: "Telefone inválido para WhatsApp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const cpfOrEmail = email || normalizeCpf(beneficiario.cpf);

    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        token,
        cpf_or_email: cpfOrEmail,
        matricula: beneficiario.matricula,
        expires_at: expiresAt.toISOString(),
        created_by_sigla: null,
        request_ip: req.headers.get("x-forwarded-for") || "unknown",
      });

    if (tokenError) {
      throw new Error(`Erro ao gerar token de redefinição: ${tokenError.message}`);
    }

    const { data: senhaExistente, error: senhaError } = await supabase
      .from("senhas")
      .select("id")
      .in("cpf", cpfVariants(beneficiario.cpf))
      .maybeSingle();

    if (senhaError) {
      throw new Error(`Erro ao verificar senha existente: ${senhaError.message}`);
    }

    const isFirstTime = !senhaExistente;
    const resetLink = `${FRONTEND_URL}/#/redefinir-senha/${token}`;
    const buttonText = isFirstTime ? "Cadastrar Minha Senha" : "Redefinir Minha Senha";

    if (canal === "EMAIL" || canal === "AMBOS") {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; padding: 20px; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo-container { margin-bottom: 20px; }
    .logo { max-width: 180px; height: auto; background-color: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
    .header h1 { margin: 15px 0 5px; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { font-size: 16px; opacity: 0.95; font-weight: 500; }
    .content { background-color: #ffffff; padding: 40px 30px; }
    .content p { margin-bottom: 16px; font-size: 15px; line-height: 1.7; }
    .message-box { background-color: #f3f4f6; border-left: 4px solid #2563eb; border-radius: 10px; padding: 16px; margin: 20px 0; color: #1f2937; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
    .link-box { word-break: break-all; background-color: #f9fafb; border: 2px dashed #e5e7eb; padding: 16px; border-radius: 10px; margin: 20px 0; font-size: 13px; color: #6b7280; font-family: 'Courier New', monospace; }
    .warning { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 10px; padding: 20px; margin: 24px 0; }
    .warning strong { display: block; margin-bottom: 10px; color: #92400e; font-size: 16px; }
    .warning ul { margin-left: 20px; color: #78350f; }
    .warning li { margin: 6px 0; font-size: 14px; }
    .data-box { background-color: #f9fafb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .data-box strong { display: block; margin-bottom: 12px; color: #1f2937; font-size: 15px; }
    .data-box ul { list-style: none; }
    .data-box li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; }
    .data-box li:last-child { border-bottom: none; }
    .footer { background-color: #f9fafb; text-align: center; padding: 30px 20px; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo-container">
        <img src="https://funsep.com.br/logo.png" alt="FUNSEP Logo" class="logo" onerror="this.style.display='none'">
      </div>
      <h1>FUNSEP</h1>
      <p>Resposta da ocorrência</p>
    </div>
    <div class="content">
      <p>Olá, <strong>${escapeHtml(nome)}</strong>,</p>
      <p>Segue o retorno referente à sua ocorrência.</p>
      <div class="message-box">${toHtmlParagraphs(mensagemPersonalizada)}</div>
      <p>Para atualizar sua senha, clique no botão abaixo:</p>
      <div class="button-container">
        <a href="${resetLink}" class="button">${buttonText}</a>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Ou copie e cole o link abaixo no seu navegador:</p>
      <div class="link-box">${resetLink}</div>
      <div class="warning">
        <strong>Importante</strong>
        <ul>
          <li>Este link é válido por <strong>24 horas</strong></li>
          <li>O link pode ser usado <strong>apenas uma vez</strong></li>
        </ul>
      </div>
      <div class="data-box">
        <strong>Seus dados</strong>
        <ul>
          <li><strong>Matrícula:</strong> ${beneficiario.matricula}</li>
          <li><strong>CPF:</strong> ${formatCpf(beneficiario.cpf)}</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p><strong>Essa é uma mensagem gerada automaticamente.</strong></p>
      <p>Em caso de dúvidas, entre em contato com a FUNSEP.</p>
      <p>&copy; ${new Date().getFullYear()} FUNSEP - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;

      const text = `${mensagemPersonalizada}\n\nLink para redefinir senha: ${resetLink}\n\n_Essa é uma mensagem gerada automaticamente_`;
      const emailResponse = await fetch(EMAIL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "FUNSEP - Resposta da ocorrência",
          text,
          html: htmlContent,
        }),
      });

      if (!emailResponse.ok) {
        const txt = await emailResponse.text();
        throw new Error(`Falha ao enviar e-mail: ${emailResponse.status} ${txt}`);
      }
    }

    if (canal === "WHATSAPP" || canal === "AMBOS") {
      const mensagemSemAbertura = stripDefaultOpening(mensagemPersonalizada);
      const whatsappMessage = [
        DEFAULT_OPENING,
        mensagemSemAbertura || undefined,
        "Link para redefinição de senha:",
        resetLink,
        "_Essa é uma mensagem gerada automaticamente_",
      ].filter(Boolean).join("\n\n");

      const waResponse = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: telefone,
          message: whatsappMessage,
        }),
      });

      if (!waResponse.ok) {
        const txt = await waResponse.text();
        throw new Error(`Falha ao enviar WhatsApp: ${waResponse.status} ${txt}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, resetLink }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em send-custom-link:", error);
    const msg = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
