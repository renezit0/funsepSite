import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface RequestPasswordResetRequest {
  cpfOrEmail: string
}

interface Beneficiario {
  matricula: number
  nome: string
  cpf: number
  email: string
}

interface ValidatedUser {
  sigla: string
  nome: string
  cargo: string
  secao: string
  matricula?: number
}

interface ValidationResult {
  success: boolean
  user?: ValidatedUser
  error?: string
}

const normalizeCpf = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(11, '0').slice(-11)
}

const cpfVariants = (value: string | number | null | undefined): string[] => {
  const normalized = normalizeCpf(value)
  if (!normalized) return []

  const compact = normalized.replace(/^0+/, '') || '0'
  if (compact === normalized) return [normalized]

  return [normalized, compact]
}

// ============= FUNÇÕES DE AUTENTICAÇÃO (inline) =============

/**
 * Extrai o token do header Authorization
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}

/**
 * Valida o token e retorna os dados reais do usuário do banco de dados
 */
async function validateToken(
  supabase: SupabaseClient,
  token: string
): Promise<ValidationResult> {
  if (!token) {
    return { success: false, error: 'Token não fornecido' }
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      return { success: false, error: 'Sessão inválida ou expirada' }
    }

    const isAdmin = !session.sigla.startsWith('BEN-')

    if (isAdmin) {
      const { data: adminUser, error: adminError } = await supabase
        .from('usuarios')
        .select('sigla, nome, cargo, secao')
        .eq('sigla', session.sigla)
        .maybeSingle()

      if (adminError || !adminUser) {
        return { success: false, error: 'Usuário não encontrado' }
      }

      return {
        success: true,
        user: {
          sigla: adminUser.sigla,
          nome: adminUser.nome,
          cargo: adminUser.cargo,
          secao: adminUser.secao
        }
      }
    } else {
      const matricula = parseInt(session.sigla.replace('BEN-', ''))

      const { data: beneficiario, error: benError } = await supabase
        .from('cadben')
        .select('matricula, nome')
        .eq('matricula', matricula)
        .maybeSingle()

      if (benError || !beneficiario) {
        return { success: false, error: 'Beneficiário não encontrado' }
      }

      return {
        success: true,
        user: {
          sigla: session.sigla,
          nome: beneficiario.nome,
          cargo: 'ASSOCIADO',
          secao: 'ASSOCIADOS',
          matricula: beneficiario.matricula
        }
      }
    }
  } catch (error) {
    console.error('Erro na validação do token:', error)
    return { success: false, error: 'Erro ao validar token' }
  }
}

/**
 * Verifica se o usuário tem um dos cargos permitidos
 */
function hasRequiredRole(user: ValidatedUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.cargo)
}

// ============= HANDLER PRINCIPAL =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { cpfOrEmail }: RequestPasswordResetRequest = await req.json()

    if (!cpfOrEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF ou email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se tem token de autorização (admin enviando para outro usuário)
    const authToken = extractToken(req)
    let adminSigla: string | null = null

    // Token de sessão admin (formato UUID) é opcional.
    // JWT do cliente Supabase (anon key) contém pontos e NÃO deve ser validado em admin_sessions.
    const isSupabaseJwt = authToken?.includes('.')

    if (authToken && !isSupabaseJwt) {
      // Validar que é admin com permissões adequadas
      const validation = await validateToken(supabase, authToken)

      if (!validation.success || !validation.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se tem permissão para enviar links de redefinição
      const allowedRoles = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS']
      if (!hasRequiredRole(validation.user, allowedRoles)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Sem permissão para esta operação' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      adminSigla = validation.user.sigla
    }

    console.log('Solicitação de redefinição de senha:', { cpfOrEmail, requestedBy: adminSigla || 'auto-solicitação' })

    const cleanInput = cpfOrEmail.replace(/\D/g, '')
    const isEmail = cpfOrEmail.includes('@')

    let beneficiario: Beneficiario | null = null

    if (isEmail) {
      const { data, error } = await supabase
        .from('cadben')
        .select('matricula, nome, cpf, email')
        .eq('email', cpfOrEmail)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar por email:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar associado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      beneficiario = data
    } else {
      const cpfNumber = parseInt(cleanInput)
      const { data, error } = await supabase
        .from('cadben')
        .select('matricula, nome, cpf, email')
        .eq('cpf', cpfNumber)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar por CPF:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar associado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      beneficiario = data
    }

    if (!beneficiario) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Se o CPF/email estiver cadastrado, você receberá um link para redefinir sua senha.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!beneficiario.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Associado não possui email cadastrado. Entre em contato com a administração.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        token,
        cpf_or_email: cpfOrEmail,
        matricula: beneficiario.matricula,
        expires_at: expiresAt.toISOString(),
        created_by_sigla: adminSigla || null,
        request_ip: req.headers.get('x-forwarded-for') || 'unknown'
      })

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao gerar link de redefinição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: senhaExistente } = await supabase
      .from('senhas')
      .select('id')
      .in('cpf', cpfVariants(beneficiario.cpf))
      .maybeSingle()

    const isFirstTime = !senhaExistente
    const resetLink = `${Deno.env.get('FRONTEND_URL') || 'https://funsep.com.br'}/#/redefinir-senha/${token}`
    const subject = isFirstTime ? 'Cadastro de Senha - FUNSEP' : 'Redefinição de Senha - FUNSEP'
    const actionText = isFirstTime ? 'cadastrar sua senha' : 'redefinir sua senha'
    const buttonText = isFirstTime ? 'Cadastrar Minha Senha' : 'Redefinir Minha Senha'
    const titleText = isFirstTime ? 'Cadastro de Senha' : 'Redefinição de Senha'
    const messageText = isFirstTime
      ? 'Você está recebendo este email para <strong>cadastrar sua senha</strong> de acesso ao sistema FUNSEP.'
      : 'Recebemos uma solicitação para <strong>redefinir sua senha</strong> de acesso ao sistema FUNSEP.'
    const warningText = isFirstTime
      ? '<li>Após cadastrar sua senha, você poderá acessar o sistema FUNSEP</li>'
      : '<li>Se você não solicitou esta redefinição, ignore este email</li>'

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .logo-container {
      margin-bottom: 20px;
    }
    .logo {
      max-width: 180px;
      height: auto;
      background-color: white;
      padding: 15px 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .header h1 {
      margin: 15px 0 5px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content {
      background-color: #ffffff;
      padding: 40px 30px;
    }
    .content p {
      margin-bottom: 16px;
      font-size: 15px;
      line-height: 1.7;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    }
    .link-box {
      word-break: break-all;
      background-color: #f9fafb;
      border: 2px dashed #e5e7eb;
      padding: 16px;
      border-radius: 10px;
      margin: 20px 0;
      font-size: 13px;
      color: #6b7280;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      border-radius: 10px;
      padding: 20px;
      margin: 24px 0;
    }
    .warning strong {
      display: block;
      margin-bottom: 10px;
      color: #92400e;
      font-size: 16px;
    }
    .warning ul {
      margin-left: 20px;
      color: #78350f;
    }
    .warning li {
      margin: 6px 0;
      font-size: 14px;
    }
    .data-box {
      background-color: #f9fafb;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .data-box strong {
      display: block;
      margin-bottom: 12px;
      color: #1f2937;
      font-size: 15px;
    }
    .data-box ul {
      list-style: none;
    }
    .data-box li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #4b5563;
    }
    .data-box li:last-child {
      border-bottom: none;
    }
    .footer {
      background-color: #f9fafb;
      text-align: center;
      padding: 30px 20px;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo-container">
        <img src="https://funsep.com.br/logo.png" alt="FUNSEP Logo" class="logo" onerror="this.style.display='none'">
      </div>
      <h1>FUNSEP</h1>
      <p>${titleText}</p>
    </div>

    <div class="content">
      <p>Olá, <strong>${beneficiario.nome}</strong>,</p>
      <p>${messageText}</p>
      <p>Para ${actionText}, clique no botão abaixo:</p>

      <div class="button-container">
        <a href="${resetLink}" class="button">${buttonText}</a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">Ou copie e cole o link abaixo no seu navegador:</p>
      <div class="link-box">${resetLink}</div>

      <div class="warning">
        <strong>⚠️ Importante</strong>
        <ul>
          <li>Este link é válido por <strong>24 horas</strong></li>
          <li>O link pode ser usado <strong>apenas uma vez</strong></li>
          ${warningText}
        </ul>
      </div>

      <div class="data-box">
        <strong>📋 Seus dados</strong>
        <ul>
          <li><strong>Matrícula:</strong> ${beneficiario.matricula}</li>
          <li><strong>CPF:</strong> ${String(beneficiario.cpf).padStart(11, '0').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p><strong>Este é um email automático, por favor não responda.</strong></p>
      <p>Em caso de dúvidas, entre em contato com a FUNSEP.</p>
      <p>&copy; ${new Date().getFullYear()} FUNSEP - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`

    const emailPayload = {
      to: beneficiario.email,
      subject: subject,
      text: `Olá ${beneficiario.nome}, você recebeu um link para ${actionText} de acesso ao sistema FUNSEP. Acesse: ${resetLink}`,
      html: htmlContent
    }

    console.log('Enviando email para:', beneficiario.email)

    const emailResponse = await fetch('https://api.seellbr.com/whatsapp/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    const responseText = await emailResponse.text()
    console.log('Status:', emailResponse.status, 'Response:', responseText)

    if (!emailResponse.ok) {
      console.error('Erro ao enviar email')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao enviar email. Tente novamente mais tarde.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email enviado com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: isFirstTime
          ? 'Link de cadastro enviado para seu email!'
          : 'Link de redefinição enviado para seu email!',
        isFirstTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao processar solicitação:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
