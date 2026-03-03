import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar sessão ativa
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessão inválida ou expirada' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é admin ou beneficiário
    const isAdmin = !session.sigla.startsWith('BEN-')

    if (isAdmin) {
      // Buscar dados atualizados do admin
      const { data: adminUser, error: adminError } = await supabase
        .from('usuarios')
        .select('sigla, nome, cargo, secao')
        .eq('sigla', session.sigla)
        .maybeSingle()

      if (adminError || !adminUser) {
        return new Response(
          JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            token: session.token,
            sigla: adminUser.sigla,
            expires_at: session.expires_at,
            user: {
              sigla: adminUser.sigla,
              nome: adminUser.nome,
              cargo: adminUser.cargo,
              secao: adminUser.secao
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Beneficiário
      const matricula = parseInt(session.sigla.replace('BEN-', ''))

      const { data: beneficiario, error: benError } = await supabase
        .from('cadben')
        .select('matricula, nome')
        .eq('matricula', matricula)
        .maybeSingle()

      if (benError || !beneficiario) {
        return new Response(
          JSON.stringify({ success: false, error: 'Beneficiário não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            token: session.token,
            sigla: session.sigla,
            expires_at: session.expires_at,
            user: {
              sigla: session.sigla,
              nome: beneficiario.nome,
              cargo: 'ASSOCIADO',
              secao: 'ASSOCIADOS',
              matricula: beneficiario.matricula
            }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Erro na validação:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
