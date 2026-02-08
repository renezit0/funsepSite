import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Buscando relatório com token:', token)

    // 1. Buscar relatório pelo token
    const { data: relatorio, error: relatorioError } = await supabase
      .from('relatorio_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (relatorioError || !relatorio) {
      console.error('Relatório não encontrado:', relatorioError)
      return new Response(
        JSON.stringify({ error: 'Relatório não encontrado ou token inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Incrementar contador de visualizações
    const { error: updateError } = await supabase
      .from('relatorio_tokens')
      .update({
        visualizacoes: relatorio.visualizacoes + 1,
        ultima_visualizacao: new Date().toISOString()
      })
      .eq('token', token)

    if (updateError) {
      console.error('Erro ao atualizar visualizações:', updateError)
      // Não falhar a visualização por isso
    }

    // 3. Buscar informações do beneficiário
    const { data: beneficiario, error: beneficiarioError } = await supabase
      .from('cadben')
      .select('nome, cpf')
      .eq('matricula', relatorio.matricula)
      .single()

    if (beneficiarioError) {
      console.error('Erro ao buscar beneficiário:', beneficiarioError)
    }

    // 4. Buscar informações de quem gerou (se houver)
    let geradoPor = null
    if (relatorio.gerado_por_sigla) {
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('nome, sigla, cargo')
        .eq('sigla', relatorio.gerado_por_sigla)
        .single()

      if (!usuarioError && usuario) {
        geradoPor = usuario
      }
    }

    console.log('Relatório encontrado e visualizações atualizadas')

    return new Response(JSON.stringify({
      html: relatorio.html_content,
      filename: relatorio.filename,
      info: {
        matricula: relatorio.matricula,
        nome_beneficiario: beneficiario?.nome || 'N/A',
        cpf_beneficiario: beneficiario?.cpf || 'N/A',
        tipo_relatorio: relatorio.tipo_relatorio,
        data_inicio: relatorio.data_inicio,
        data_fim: relatorio.data_fim,
        gerado_em: relatorio.gerado_em,
        visualizacoes: relatorio.visualizacoes + 1,
        ultima_visualizacao: new Date().toISOString(),
        gerado_por: geradoPor
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Erro ao visualizar relatório:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao visualizar relatório', details: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
