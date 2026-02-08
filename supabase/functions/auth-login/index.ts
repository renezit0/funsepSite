import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoginRequest {
  cpf: string
  senha: string
}

const isBcryptHash = (value: string | null | undefined): boolean => {
  if (!value) return false
  return /^\$2[aby]\$/.test(value)
}

const verifyPassword = async (
  plain: string,
  stored: string | null | undefined,
  onUpgrade: (plainPassword: string) => Promise<void>,
  supabase: ReturnType<typeof createClient>
): Promise<boolean> => {
  if (!stored) return false

  if (isBcryptHash(stored)) {
    const { data, error } = await supabase.rpc('verify_password', {
      plain,
      hash: stored
    })

    if (error) {
      console.error('Erro ao verificar senha:', error)
      return false
    }

    return Boolean(data)
  }

  if (plain !== stored) return false

  try {
    await onUpgrade(plain)
  } catch (error) {
    console.error('Erro ao atualizar hash de senha:', error)
  }

  return true
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

    const { cpf, senha }: LoginRequest = await req.json()

    if (!cpf || !senha) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Tentativa de login:', { cpf })

    // Verificar se é admin
    const { data: adminUser, error: adminError } = await supabase
      .from('usuarios')
      .select('sigla, nome, cargo, secao, senha')
      .eq('cpf', cpf)
      .maybeSingle()

    if (adminError) {
      console.error('Erro ao buscar admin:', adminError)
    }

    if (adminUser) {
      const passwordOk = await verifyPassword(senha, adminUser.senha, async (plainPassword) => {
        await supabase
          .from('usuarios')
          .update({ senha: plainPassword })
          .eq('sigla', adminUser.sigla)
      }, supabase)

      if (!passwordOk) {
        return new Response(
          JSON.stringify({ success: false, error: 'CPF ou senha inválidos' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const user = adminUser
      
      // Criar sessão
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          sigla: user.sigla,
          token,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })

      if (sessionError) {
        console.error('Erro ao criar sessão admin:', sessionError)
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao criar sessão' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            token,
            sigla: user.sigla,
            expires_at: expiresAt.toISOString(),
            user: {
              sigla: user.sigla,
              nome: user.nome,
              cargo: user.cargo,
              secao: user.secao
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se não é admin, verificar na tabela senhas
    const { data: senhaRecord, error: senhaError } = await supabase
      .from('senhas')
      .select('*')
      .eq('cpf', cpf)
      .maybeSingle()

    if (senhaError) {
      console.error('Erro ao verificar senha:', senhaError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na autenticação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!senhaRecord) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF ou senha inválidos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const passwordOk = await verifyPassword(senha, senhaRecord.senha, async (plainPassword) => {
      await supabase
        .from('senhas')
        .update({ senha: plainPassword })
        .eq('id', senhaRecord.id)
    }, supabase)

    if (!passwordOk) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF ou senha inválidos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados do beneficiário
    const { data: beneficiario, error: benError } = await supabase
      .from('cadben')
      .select('*')
      .eq('matricula', senhaRecord.matricula)
      .maybeSingle()

    if (benError || !beneficiario) {
      console.error('Erro ao buscar beneficiário:', benError)
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do beneficiário não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar sessão de beneficiário
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const sigla = `BEN-${beneficiario.matricula}`

    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        sigla,
        token,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })

    if (sessionError) {
      console.error('Erro ao criar sessão beneficiário:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar sessão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          token,
          sigla,
          expires_at: expiresAt.toISOString(),
          user: {
            sigla,
            nome: beneficiario.nome || senhaRecord.nome,
            cargo: 'ASSOCIADO',
            secao: 'ASSOCIADOS',
            matricula: beneficiario.matricula
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no login:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
