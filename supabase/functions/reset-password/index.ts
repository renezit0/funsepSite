import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  token: string
  newPassword: string
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname

    // Endpoint para validar token (GET)
    if (req.method === 'GET' && path.includes('/validate')) {
      const token = url.searchParams.get('token')

      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token não fornecido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar token no banco
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*, cadben!password_reset_tokens_matricula_fkey(nome, cpf, matricula)')
        .eq('token', token)
        .maybeSingle()

      // Verificar se já tem senha cadastrada
      let hasPassword = false
      if (tokenData && tokenData.cadben) {
        const { data: senhaExistente } = await supabase
          .from('senhas')
          .select('id')
          .in('cpf', cpfVariants(tokenData.cadben.cpf))
          .maybeSingle()
        hasPassword = !!senhaExistente
      }

      if (tokenError) {
        console.error('Erro ao buscar token:', tokenError)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao validar token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!tokenData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se token já foi usado
      if (tokenData.used) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este link já foi utilizado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se token expirou
      const expiresAt = new Date(tokenData.expires_at)
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este link expirou. Solicite um novo link.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            nome: tokenData.cadben?.nome,
            cpf: tokenData.cadben?.cpf,
            matricula: tokenData.cadben?.matricula,
            hasPassword
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Endpoint para resetar senha (POST)
    if (req.method === 'POST') {
      const { token, newPassword }: ResetPasswordRequest = await req.json()

      if (!token || !newPassword) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token e nova senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validar senha
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: 'A senha deve ter no mínimo 6 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Tentativa de redefinição de senha com token:', token)

      // Buscar token no banco
      const { data: tokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle()

      if (tokenError) {
        console.error('Erro ao buscar token:', tokenError)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao validar token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!tokenData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se token já foi usado
      if (tokenData.used) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este link já foi utilizado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se token expirou
      const expiresAt = new Date(tokenData.expires_at)
      if (expiresAt < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Este link expirou. Solicite um novo link.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar dados do beneficiário
      const { data: beneficiario, error: benError } = await supabase
        .from('cadben')
        .select('matricula, nome, cpf')
        .eq('matricula', tokenData.matricula)
        .maybeSingle()

      if (benError || !beneficiario) {
        console.error('Erro ao buscar beneficiário:', benError)
        return new Response(
          JSON.stringify({ success: false, error: 'Beneficiário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verificar se já existe senha cadastrada
      const { data: senhaExistente, error: senhaCheckError } = await supabase
        .from('senhas')
        .select('id')
        .in('cpf', cpfVariants(beneficiario.cpf))
        .maybeSingle()

      if (senhaCheckError && senhaCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar senha existente:', senhaCheckError)
      }

      // Atualizar ou criar senha
      if (senhaExistente) {
        // Atualizar senha existente
        const { error: updateError } = await supabase
          .from('senhas')
          .update({
            senha: newPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', senhaExistente.id)

        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError)
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao atualizar senha' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Criar nova senha
        const { error: insertError } = await supabase
          .from('senhas')
          .insert({
            cpf: normalizeCpf(beneficiario.cpf),
            senha: newPassword,
            matricula: beneficiario.matricula,
            nome: beneficiario.nome,
            created_by_sigla: 'SELF_SERVICE'
          })

        if (insertError) {
          console.error('Erro ao criar senha:', insertError)
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao criar senha' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Marcar token como usado
      const { error: markUsedError } = await supabase
        .from('password_reset_tokens')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('token', token)

      if (markUsedError) {
        console.error('Erro ao marcar token como usado:', markUsedError)
      }

      console.log('Senha redefinida com sucesso para matrícula:', beneficiario.matricula)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Senha redefinida com sucesso! Você já pode fazer login.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao processar solicitação:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
