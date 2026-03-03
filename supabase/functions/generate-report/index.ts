import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface ReportData {
  matricula: number
  dataInicio: string
  dataFim: string
  reportType: 'a_pagar' | 'pagos' | 'ir' | 'mensalidades' | 'ir_years'
  irMode?: 'regular' | 'boleto'
  geradoPorMatricula?: number
  geradoPorSigla?: string
}

interface Beneficiary {
  matricula: number
  nome: string
  cpf: number
}

interface Procedure {
  matricula: number
  dep: string
  dtatend: string
  datavenc: string
  valorpago: number
  valorpart: number
  evento: string
  nome_beneficio?: string
  nome_dependente?: string | null
}

interface Benefit {
  codigo: string
  nome: string
}

interface Dependent {
  nrodep: number
  nome: string
}

interface ReportTotals {
  titular: {
    procedimento: number
    participacao: number
    quantidade: number
  }
  dependentes: {
    procedimento: number
    participacao: number
    quantidade: number
  }
  geral: {
    procedimento: number
    participacao: number
    quantidade: number
  }
}

// Função para obter data/hora no horário de Brasília
function getDataHoraBrasilia(): Date {
  const agora = new Date();
  
  // Converter para string no formato de Brasília e depois voltar para Date
  const brasiliaString = agora.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse do formato "dd/MM/yyyy, HH:mm:ss"
  const [dataParte, horaParte] = brasiliaString.split(', ');
  const [dia, mes, ano] = dataParte.split('/').map(Number);
  const [hora, minuto, segundo] = horaParte.split(':').map(Number);
  
  return new Date(ano, mes - 1, dia, hora, minuto, segundo);
}

function formatarDataHoraBrasilia(data: Date): string {
  return data.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function parseNumberBR(value: string): number {
  const raw = value.trim();
  if (raw === '') return 0;

  if (raw.includes(',') && raw.includes('.')) {
    // Formato BR com milhar e decimal: 1.234,56
    return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (raw.includes(',')) {
    // Decimal com vírgula: 123,45
    return parseFloat(raw.replace(',', '.')) || 0;
  }

  // Decimal com ponto ou inteiro
  return parseFloat(raw) || 0;
}

function parseCurrencyToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    // Se tem parte decimal, considerar que está em reais.
    if (value % 1 !== 0) {
      return Math.round(value * 100);
    }
    // Inteiro: assumir que já está em centavos.
    return value;
  }

  const raw = String(value).trim();
  if (raw === '') return 0;

  // Se tem separador decimal, considerar que está em reais.
  if (raw.includes(',') || raw.includes('.')) {
    const valorReais = parseNumberBR(raw);
    return Math.round(valorReais * 100);
  }

  const inteiro = parseInt(raw, 10);
  return Number.isFinite(inteiro) ? inteiro : 0;
}

function safeNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return parseNumberBR(String(value))
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    // Criar cliente Supabase com service role para consultas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { matricula, dataInicio, dataFim, reportType, irMode, geradoPorMatricula, geradoPorSigla }: ReportData = await req.json()

    console.log('Iniciando geração de relatório:', { matricula, dataInicio, dataFim, reportType, geradoPorMatricula, geradoPorSigla })

    // VALIDAÇÃO DE SEGURANÇA: Tentar header primeiro, fallback para body
    const authHeader = req.headers.get('Authorization')
    let validatedSigla = geradoPorSigla
    let validatedMatricula = geradoPorMatricula

    // Se tem header Authorization, validar token (MÉTODO SEGURO)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Validando via token no header...')
      const tokenParts = authHeader.split(' ')
      const token = tokenParts[1]

      // Validar token e buscar dados REAIS do banco
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!sessionError && session) {
        console.log('Token validado para sigla:', session.sigla)

        // Buscar dados REAIS do usuário
        const isAdmin = !session.sigla.startsWith('BEN-')

        if (isAdmin) {
          const { data: adminUser } = await supabase
            .from('usuarios')
            .select('sigla, cargo')
            .eq('sigla', session.sigla)
            .maybeSingle()

          if (adminUser && ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'].includes(adminUser.cargo)) {
            validatedSigla = adminUser.sigla
            validatedMatricula = undefined
            console.log('Admin validado via token:', validatedSigla)
          }
        } else {
          const matriculaReal = parseInt(session.sigla.replace('BEN-', ''))
          if (matriculaReal === matricula) {
            validatedMatricula = matriculaReal
            validatedSigla = session.sigla
            console.log('Beneficiário validado via token:', validatedMatricula)
          } else {
            return new Response(
              JSON.stringify({ error: 'Você só pode gerar relatórios da sua própria matrícula' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
    } else if (!geradoPorSigla && !geradoPorMatricula) {
      // Sem autenticação
      console.error('Tentativa de acesso sem autenticação')
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // validatedSigla e validatedMatricula já foram definidos acima

    if (reportType === 'ir_years') {
      const anosRegularSet = new Set<number>()
      const anosBoletoSet = new Set<number>()
      const tabelasIR = [
        { nome: 'irpfd', tipo: 'regular' as const },
        { nome: 'irpft', tipo: 'regular' as const },
        { nome: 'irpfdb', tipo: 'boleto' as const },
        { nome: 'irpftb', tipo: 'boleto' as const },
      ]

      for (const tabela of tabelasIR) {
        const { data, error } = await supabase
          .from(tabela.nome)
          .select('ano')
          .eq('matricula', matricula)

        if (error) {
          console.error(`Erro ao buscar anos em ${tabela.nome}:`, error)
          continue
        }

        for (const item of data || []) {
          const ano = Number(item?.ano)
          if (Number.isFinite(ano) && ano > 0) {
            if (tabela.tipo === 'boleto') {
              anosBoletoSet.add(ano)
            } else {
              anosRegularSet.add(ano)
            }
          }
        }
      }

      const anosRegular = Array.from(anosRegularSet).sort((a, b) => b - a)
      const anosBoleto = Array.from(anosBoletoSet).sort((a, b) => b - a)
      const anos = Array.from(new Set([...anosRegular, ...anosBoleto])).sort((a, b) => b - a)

      return new Response(JSON.stringify({
        anos,
        anosRegular,
        anosBoleto,
        hasBoleto: anosBoleto.length > 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      })
    }

    // 1. Buscar beneficiário
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('cadben')
      .select('matricula, nome, cpf')
      .eq('matricula', matricula)
      .single()

    if (beneficiaryError || !beneficiary) {
      console.error('Beneficiário não encontrado:', beneficiaryError)
      return new Response(
        JSON.stringify({ error: 'Beneficiário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar tipo de relatório e executar lógica apropriada
    if (reportType === 'ir') {
      const anoCalendario = parseInt(dataInicio.split('-')[0]) // Ano selecionado na interface
      const anoExercicio = anoCalendario + 1 // Ano do exercício (sempre ano+1)
      return await generateIRReport(supabase, beneficiary, matricula, anoCalendario, anoExercicio, irMode, validatedMatricula, validatedSigla)
    }

    if (reportType === 'mensalidades') {
      const ano = parseInt(dataInicio.split('-')[0]) // Ano selecionado na interface
      return await generateMensalidadesReport(supabase, beneficiary, matricula, ano, validatedMatricula, validatedSigla)
    }

    // 2. Buscar procedimentos (para relatórios a_pagar e pagos)
    // Se dataFim estiver vazio, usar o último dia do mês atual
    const hoje = new Date()
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    const dataFimFinal = dataFim && dataFim.trim() !== '' ? dataFim : ultimoDiaMes

    // Converter datas YYYY-MM-DD para YYYYMMDD (formato numérico usado no banco)
    const dataInicioNum = dataInicio.replace(/-/g, '')
    const dataFimNum = dataFimFinal.replace(/-/g, '')

    console.log('Buscando procedimentos com datas convertidas:', { dataInicioNum, dataFimNum })

    // Escolher tabela correta baseado no tipo de relatório
    const tabelaProcedimentos = reportType === 'pagos' ? 'mgumrr' : 'mgumrrapg'

    const { data: procedimentos, error: procedimentosError } = await supabase
      .from(tabelaProcedimentos)
      .select('matricula, dep, dtatend, datavenc, valorpago, valorpart, evento')
      .eq('matricula', matricula)
      .gte('datavenc', dataInicioNum)
      .lte('datavenc', dataFimNum)
      .order('dtatend')

    if (procedimentosError) {
      console.error('Erro ao buscar procedimentos:', procedimentosError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar procedimentos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Procedimentos encontrados:', procedimentos?.length || 0, 'para o período:', dataInicio, 'a', dataFimFinal)

    if (!procedimentos || procedimentos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum procedimento encontrado para o período informado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Buscar benefícios para os eventos encontrados
    const eventosUnicos = [...new Set(procedimentos.map(p => p.evento))]
    console.log('Eventos únicos encontrados:', eventosUnicos.length)

    const { data: beneficios, error: beneficiosError } = await supabase
      .from('tabbeneficios')
      .select('codigo, nome')
      .in('codigo', eventosUnicos)

    if (beneficiosError) {
      console.error('Erro ao buscar benefícios:', beneficiosError)
    }

    console.log('Benefícios encontrados:', beneficios?.length || 0, 'de', eventosUnicos.length, 'eventos')

    // 4. Buscar dependentes
    const { data: dependentesInfo, error: dependentesError } = await supabase
      .from('caddep')
      .select('matricula, nrodep, nome')
      .eq('matricula', matricula)

    if (dependentesError) {
      console.error('Erro ao buscar dependentes:', dependentesError)
    }

    // 5. Criar mapeamentos otimizados
    const beneficiosMap = new Map<string, string>()
    if (beneficios) {
      beneficios.forEach((b: Benefit) => {
        if (b.codigo && b.nome) {
          beneficiosMap.set(b.codigo, b.nome)
        }
      })
    }

    const dependentesMap = new Map<string, string>()
    if (dependentesInfo) {
      dependentesInfo.forEach((d: Dependent) => {
        if (d.nrodep && d.nome) {
          dependentesMap.set(d.nrodep.toString(), d.nome)
        }
      })
    }

    console.log('Mapeamento criado - Benefícios:', beneficiosMap.size, 'Dependentes:', dependentesMap.size)

    // 6. Processar procedimentos com nomes
    const procedimentosComNomes = procedimentos.map((proc: Procedure) => {
      const nomeBeneficio = beneficiosMap.get(proc.evento) || `Código não catalogado: ${proc.evento}`
      const nomeDependente = proc.dep && proc.dep !== '0' && proc.dep !== '' 
        ? (dependentesMap.get(proc.dep) || `Dependente ${proc.dep}`)
        : null

      return {
        ...proc,
        valorpago: parseCurrencyToCents(proc.valorpago as unknown as string | number),
        valorpart: parseCurrencyToCents(proc.valorpart as unknown as string | number),
        nome_beneficio: nomeBeneficio,
        nome_dependente: nomeDependente
      }
    })

    // 7. Separar titular e dependentes
    const titular = procedimentosComNomes.filter(proc =>
      !proc.dep || proc.dep === '' || proc.dep === '0'
    )

    const dependentes = procedimentosComNomes.filter(proc =>
      proc.dep && proc.dep !== '' && proc.dep !== '0'
    )

    console.log('Processados:', titular.length, 'titular,', dependentes.length, 'dependentes')

    // 8. Calcular totais
    const totaisTitular = titular.reduce((acc, proc) => ({
      procedimento: acc.procedimento + (parseCurrencyToCents(proc.valorpago as unknown as string | number) || 0),
      participacao: acc.participacao + (parseCurrencyToCents(proc.valorpart as unknown as string | number) || 0),
      quantidade: acc.quantidade + 1
    }), { procedimento: 0, participacao: 0, quantidade: 0 })

    const totaisDependentes = dependentes.reduce((acc, proc) => ({
      procedimento: acc.procedimento + (parseCurrencyToCents(proc.valorpago as unknown as string | number) || 0),
      participacao: acc.participacao + (parseCurrencyToCents(proc.valorpart as unknown as string | number) || 0),
      quantidade: acc.quantidade + 1
    }), { procedimento: 0, participacao: 0, quantidade: 0 })

    const totaisGeral = {
      procedimento: totaisTitular.procedimento + totaisDependentes.procedimento,
      participacao: totaisTitular.participacao + totaisDependentes.participacao,
      quantidade: totaisTitular.quantidade + totaisDependentes.quantidade
    }
    const valorTotalCentavos = totaisGeral.participacao
    const detalhesRelatorio = {
      metrica_valor_total: 'participacao',
      totais_centavos: {
        titular: totaisTitular,
        dependentes: totaisDependentes,
        geral: totaisGeral,
      }
    }

    // 9. Gerar HTML do relatório
    const htmlContent = generateReportHTML(
      beneficiary,
      titular,
      dependentes,
      { titular: totaisTitular, dependentes: totaisDependentes, geral: totaisGeral },
      dataInicio,
      dataFimFinal,
      reportType
    )

    const filename = `${beneficiary.nome.replace(/[^A-Z0-9]/gi, '_')}_${matricula}_${new Date().getFullYear()}.pdf`

    // 10. Gerar token único e salvar no banco
    const token = crypto.randomUUID()
    // Adicionar token ao HTML antes de salvar
    const htmlWithToken = htmlContent.replace(
      '</body>',
      `<div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 5px;">
        <p style="margin: 0; font-size: 12px; color: #666;"><strong>Token de Validação:</strong></p>
        <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 11px; color: #333; word-break: break-all;">${token}</p>
      </div></body>`
    )
    
    const { error: tokenError } = await supabase
      .from('relatorio_tokens')
      .insert({
        token,
        matricula,
        tipo_relatorio: reportType,
        data_inicio: dataInicio,
        data_fim: dataFimFinal,
        gerado_por_matricula: validatedMatricula,
        gerado_por_sigla: validatedSigla,
        valor_total_centavos: valorTotalCentavos,
        detalhes_relatorio: detalhesRelatorio,
        html_content: htmlWithToken,
        filename
      })

    if (tokenError) {
      console.error('Erro ao salvar token:', tokenError)
      // Não falhar a geração do relatório, apenas logar o erro
    } else {
      console.log('Token gerado e salvo com sucesso:', token)
    }

    console.log('Relatório gerado com sucesso')

    return new Response(JSON.stringify({ 
      html: htmlWithToken,
      filename,
      token
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao gerar relatório', details: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateIRReport(
  supabase: any,
  beneficiary: any,
  matricula: number,
  anoCalendario: number,
  anoExercicio: number,
  irMode?: 'regular' | 'boleto',
  geradoPorMatricula?: number,
  geradoPorSigla?: string
) {
  try {
    console.log('Gerando relatório IR para:', { matricula, anoCalendario, anoExercicio })
    const isTitularRegistro = (item: any) =>
      item.nrodep === '0' || item.nrodep === 0 || !item.nrodep || item.nrodep === ''

    const regularSources = [
      {
        table: 'irpfd',
        label: 'IRPFD',
        detailTable: 'irpfd',
        parseGuia: (item: any) => parseCurrencyToCents(item.vlguia)
      },
      {
        table: 'irpft',
        label: 'IRPFT',
        detailTable: 'irpfd',
        parseGuia: (item: any) => parseCurrencyToCents(item.vlguia) || parseCurrencyToCents(item.guiat)
      }
    ]
    const boletoSources = [
      {
        table: 'irpfdb',
        label: 'IRPFDB',
        detailTable: 'irpfdb',
        parseGuia: (item: any) => parseCurrencyToCents(item.vlguia)
      },
      {
        table: 'irpftb',
        label: 'IRPFTB',
        detailTable: 'irpfdb',
        parseGuia: (item: any) => parseCurrencyToCents(item.vlguia) || parseCurrencyToCents(item.guiat)
      }
    ]
    const irSources = irMode === 'boleto'
      ? [...boletoSources, ...regularSources]
      : [...regularSources, ...boletoSources]

    let totalTitularMensalidade = 0
    let totalTitularGuia = 0
    let fonteDados = ''
    let tabelaDependentes = 'irpfd'

    for (const source of irSources) {
      try {
        const { data: irData, error: irError } = await supabase
          .from(source.table)
          .select('*')
          .eq('matricula', matricula)
          .eq('ano', anoCalendario)

        if (irError) {
          console.error(`Erro na consulta ${source.label}:`, irError)
          continue
        }

        const dadosTitular = (irData || []).filter(isTitularRegistro)
        if (!dadosTitular.length) {
          continue
        }

        totalTitularMensalidade = dadosTitular.reduce((acc: number, item: any) => {
          return acc + (parseCurrencyToCents(item.vlmen) || parseCurrencyToCents(item.ment))
        }, 0)
        totalTitularGuia = dadosTitular.reduce((acc: number, item: any) => {
          return acc + source.parseGuia(item)
        }, 0)

        fonteDados = source.label
        tabelaDependentes = source.detailTable
        console.log(`Usando dados do ${source.label} - Mensalidade:`, totalTitularMensalidade, 'Guia:', totalTitularGuia)
        break
      } catch (err) {
        console.error(`Erro inesperado na consulta ${source.label}:`, err)
      }
    }
    
    // 3. Buscar dependentes
    let dependentes: any[] = []
    try {
      const { data: dependentesData, error: dependentesError } = await supabase
        .from('caddep')
        .select('nrodep, nome, cpf')
        .eq('matricula', matricula)
      
      if (dependentesError) {
        console.error('Erro ao buscar dependentes:', dependentesError)
      } else {
        dependentes = dependentesData || []
        console.log('Dependentes encontrados:', dependentes.length)
      }
    } catch (err) {
      console.error('Erro na consulta dependentes:', err)
    }
    
    // 4. Buscar dados de IR dos dependentes (base regular: IRPFD | base boleto: IRPFDB) - apenas nrodep > 0
    let irDependentes: any[] = []
    try {
      const { data: irDependentesData, error: irDependentesError } = await supabase
        .from(tabelaDependentes)
        .select('*')
        .eq('matricula', matricula)
        .eq('ano', anoCalendario) // Buscar pelo ano calendário
      
      console.log(`${tabelaDependentes.toUpperCase()} Dependentes - Todos os dados:`, irDependentesData)
      
      if (irDependentesError) {
        console.error('Erro ao buscar IR dependentes:', irDependentesError)
      } else {
        // Filtrar apenas dependentes (excluir titular)
        irDependentes = (irDependentesData || []).filter((item: any) => 
          item.nrodep && item.nrodep !== '0' && item.nrodep !== 0 && item.nrodep !== ''
        )
        console.log('IR Dependentes filtrado:', irDependentes)
      }
    } catch (err) {
      console.error(`Erro na consulta ${tabelaDependentes.toUpperCase()} dependentes:`, err)
    }
    
    console.log(`=== RESUMO IR ===`)
    console.log(`Fonte de dados: ${fonteDados}`)
    console.log(`Titular - Mensalidade: ${totalTitularMensalidade}, Guia: ${totalTitularGuia}`)
    console.log(`Dependentes: ${irDependentes.length} registros`)
    
    // Gerar HTML do relatório IR
    const totalDependentesCentavos = irDependentes.reduce((acc: number, dep: any) => {
      return acc + parseCurrencyToCents(dep.vlmen) + parseCurrencyToCents(dep.vlguia)
    }, 0)
    const totalTitularCentavos = totalTitularMensalidade + totalTitularGuia
    const totalGeralCentavos = totalTitularCentavos + totalDependentesCentavos
    const detalhesRelatorio = {
      totais_centavos: {
        titular: {
          mensalidade: totalTitularMensalidade,
          guia: totalTitularGuia,
          total: totalTitularCentavos,
        },
        dependentes: {
          total: totalDependentesCentavos,
          quantidade: irDependentes.length,
        },
        geral: {
          total: totalGeralCentavos,
        }
      }
    }

    const htmlContent = generateIRReportHTML(
      beneficiary,
      { mensalidade: totalTitularMensalidade, guia: totalTitularGuia },
      dependentes,
      irDependentes,
      anoCalendario,
      anoExercicio
    )
    
    const filename = `IR_${beneficiary.nome.replace(/[^A-Z0-9]/gi, '_')}_${matricula}_${anoCalendario}.pdf`

    // Gerar token único e salvar no banco
    const token = crypto.randomUUID()
    // Adicionar token ao HTML antes de salvar
    const htmlWithToken = htmlContent.replace(
      '</body>',
      `<div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 5px;">
        <p style="margin: 0; font-size: 12px; color: #666;"><strong>Token de Validação:</strong></p>
        <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 11px; color: #333; word-break: break-all;">${token}</p>
      </div></body>`
    )
    
    const { error: tokenError } = await supabase
      .from('relatorio_tokens')
      .insert({
        token,
        matricula,
        tipo_relatorio: 'ir',
        data_inicio: `${anoCalendario}-01-01`,
        data_fim: `${anoCalendario}-12-31`,
        gerado_por_matricula: geradoPorMatricula,
        gerado_por_sigla: geradoPorSigla,
        valor_total_centavos: totalGeralCentavos,
        detalhes_relatorio: detalhesRelatorio,
        html_content: htmlWithToken,
        filename
      })

    if (tokenError) {
      console.error('Erro ao salvar token IR:', tokenError)
    } else {
      console.log('Token IR gerado e salvo com sucesso:', token)
    }
    
    return new Response(JSON.stringify({ 
      html: htmlWithToken,
      filename,
      token
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error) {
    console.error('Erro geral ao gerar relatório IR:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar relatório IR', details: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function generateIRReportHTML(
  beneficiary: any,
  totalTitular: { mensalidade: number, guia: number },
  dependentes: any[],
  irDependentes: any[],
  anoCalendario: number,
  anoExercicio: number
): string {
  
  console.log('Gerando HTML IR com dados:', { 
    beneficiary: beneficiary?.nome, 
    totalTitular, 
    dependentesCount: dependentes.length, 
    irDependentesCount: irDependentes.length 
  })
  
  // Criar mapeamento de dependentes
  const dependentesMap = new Map<string, any>()
  dependentes.forEach(dep => {
    dependentesMap.set(dep.nrodep.toString(), dep)
  })
  
  // Processar dados de IR dos dependentes (EXCLUIR nrodep = "0" que é o titular)
  const dependentesComIR = irDependentes
    .filter(ir => ir.nrodep !== "0" && ir.nrodep !== 0) // Filtrar titular
    .map(ir => {
      const dependente = dependentesMap.get(ir.nrodep?.toString() || '')
      const vlmen = parseCurrencyToCents(ir.vlmen) || parseCurrencyToCents(ir.ment) || parseCurrencyToCents(ir.vlmensalidade)
      const vlguia = parseCurrencyToCents(ir.vlguia) || parseCurrencyToCents(ir.vlparticipacao)
      
      return {
        ...ir,
        nome: dependente?.nome || `Dependente ${ir.nrodep}`,
        cpf: dependente?.cpf || '',
        vlmen: vlmen,
        vlguia: vlguia
      }
    })
    .filter(dep => dep.vlmen > 0 || dep.vlguia > 0) // Filtrar apenas dependentes com valores
  
  // Calcular totais
  const totalTitularCompleto = totalTitular.mensalidade + totalTitular.guia
  const totalDependentes = dependentesComIR.reduce((acc, dep) => {
    return acc + dep.vlmen + dep.vlguia
  }, 0)
  const totalGeral = totalTitularCompleto + totalDependentes
  
  console.log('Totais IR calculados:', { totalTitularCompleto, totalDependentes, totalGeral })
  console.log('Beneficiário:', beneficiary)
  
  const dataAtual = getDataHoraBrasilia()

  // Gerar texto da declaração de forma mais segura
  const valorPorExtenso = formatCurrencyText(totalGeral)
  const nomeUpperCase = beneficiary.nome.toUpperCase()
  const cpfFormatado = formatCPF(beneficiary.cpf)
  const valorFormatado = formatCurrency(totalGeral)
  
  console.log('Valores formatados:', { valorPorExtenso, nomeUpperCase, cpfFormatado, valorFormatado })

    return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Declaração IR - ${beneficiary.matricula}</title>
    <style>
      @page {
        margin: 15mm 12mm 20mm 12mm;
        size: A4 portrait;
      }

      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 8px 8px 20px 8px;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: #fff;
        box-sizing: border-box;
        width: 186mm;
        max-width: 186mm;
        max-height: 257mm;
        overflow: visible;
      }

      * {
        box-sizing: border-box;
      }

      .header { 
        text-align: center; 
        margin-bottom: 20px;
        border-bottom: 2px solid #2c5aa0;
        padding: 15px 4px 10px 4px;
      }
        
      .logo { 
        margin-bottom: 4px;
        text-align: center;
      }
        
      .logo img {
        width: 290px;
        max-width: 90%;
        height: auto;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      }
        
      .title { 
        font-size: 20px;
        font-weight: bold; 
        margin: 6px 0;
        color: #2c5aa0;
      }
        
      .info-box {
        border: 1px solid #ddd;
        padding: 10px;
        margin: 8px 0 15px 0;
        border-radius: 3px;
        background-color: #f9f9f9;
        font-size: 10px;
        overflow: hidden;
        clear: both;
        position: relative;
        z-index: 2;
      }
      .info-row {
        display: block;
        margin-bottom: 4px;
        line-height: 1.4;
        clear: left;
      }
      .info-label {
        font-weight: bold;
        color: #555;
      }
      .declaracao-text {
        text-align: justify;
        margin: 20px 0;
        line-height: 1.6;
        font-size: 12px;
        display: block !important;
        clear: both;
        color: #222 !important;
        background: none !important;
        font-weight: 500;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 18px 0;
        font-size: 12px;
      }
      th, td { 
        border: 1px solid #000;
        padding: 10px 8px;
        text-align: center;
        line-height: 1.5;
        vertical-align: middle;
      }
      th { 
        background-color: #f0f0f0;
        font-weight: bold; 
        font-size: 11px;
        padding: 12px 8px;
      }
      .right { text-align: right !important; }
      .center { text-align: center !important; }
      .left { text-align: left !important; }
      .total-row { 
        background: #e8e8e8;
        font-weight: bold;
        font-size: 12px;
      }
      .footer { 
        margin-top: 40px;
        text-align: center; 
        font-size: 12px;
        color: #6c757d;
        border-top: 1px solid #dee2e6;
        padding-top: 18px;
        line-height: 1.5;
      }
      .currency {
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">
        <img src="/images/logo-funsep-completa-relatorio.svg" alt="Logo FUNSEP">
      </div>
      <div class="title">DECLARAÇÃO</div>
    </div>

    <div class="declaracao-text">
      DECLARAMOS, para os devidos fins que <strong>${nomeUpperCase}</strong>, 
      portador do CPF nº <strong>${cpfFormatado}</strong>, 
      associado deste Funsep/Unimed, plano de saúde número de matrícula ${beneficiary.matricula}, no 
      exercício de ${anoExercicio}/Ano-Calendário ${anoCalendario}, pagou ao FUNSEP - CNPJ 77.750.354/0001-88, 
      o valor de R$ <strong class="currency">${valorFormatado}</strong> (${valorPorExtenso}), 
      assim discriminados:
    </div>

    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>CPF</th>
          <th>Mensalidade</th>
          <th>Participação em guia</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="left">${beneficiary.nome.toUpperCase()}</td>
          <td>${formatCPF(beneficiary.cpf)}</td>
          <td class="currency right">${formatCurrency(totalTitular.mensalidade)}</td>
          <td class="currency right">${formatCurrency(totalTitular.guia)}</td>
          <td class="currency right">${formatCurrency(totalTitularCompleto)}</td>
        </tr>
        ${dependentesComIR.map(dep => `
          <tr>
            <td class="left">${dep.nome.toUpperCase()}</td>
            <td>${formatCPF(dep.cpf)}</td>
            <td class="currency right">${formatCurrency(dep.vlmen)}</td>
            <td class="currency right">${formatCurrency(dep.vlguia)}</td>
            <td class="currency right">${formatCurrency(dep.vlmen + dep.vlguia)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="4" class="right"><strong>TOTAL --></strong></td>
          <td class="currency right"><strong>${formatCurrency(totalGeral)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p><strong>FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO - CNPJ 77.750.354/0001-88</strong></p>
      <p>Gerado em ${formatarDataHoraBrasilia(dataAtual)} - Documento válido sem assinatura</p>
    </div>
  </body>
  </html>
    `
}

function generateReportHTML(
  beneficiary: Beneficiary,
  titular: Procedure[],
  dependentes: Procedure[],
  totais: ReportTotals,
  dataInicio: string,
  dataFim: string,
  reportType: 'a_pagar' | 'pagos' | 'ir'
): string {
  const tituloRelatorio = reportType === 'pagos'
    ? 'RELATÓRIO DE PROCEDIMENTOS PAGOS'
    : 'RELATÓRIO DE PROCEDIMENTOS A PAGAR'

  const dataAtual = getDataHoraBrasilia()

  // Agrupar procedimentos por dependente
  const procedimentosPorDependente: { [key: string]: Procedure[] } = {}
  dependentes.forEach(proc => {
    const nomeDependente = proc.nome_dependente || `Dependente ${proc.dep}`
    if (!procedimentosPorDependente[nomeDependente]) {
      procedimentosPorDependente[nomeDependente] = []
    }
    procedimentosPorDependente[nomeDependente].push(proc)
  })

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório FUNSEP - ${beneficiary.matricula}</title>
    <style>
        @page {
            margin: 12mm 12mm 12mm 12mm;
            size: A4 portrait;
        }

        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 2px 8px 20px 8px;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            background: #fff;
            box-sizing: border-box;
            width: 186mm;
            max-width: 186mm;
            overflow: visible;
        }

        * {
            box-sizing: border-box;
        }

        .header { 
            text-align: center; 
            margin-bottom: 6px;
            margin-top: 0;
            border-bottom: 2px solid #2c5aa0;
            padding: 4px 4px 4px 4px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 3px;
            position: relative;
            z-index: 1;
        }
        
        .logo { 
            margin-bottom: 1px;
            text-align: center;
        }
        
        .logo img {
            width: 260px;
            max-width: 90%;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
        }
        
        .header .cnpj {
            font-size: 6px;
            color: #777;
            margin-top: 1px;
        }
        
        .title { 
            font-size: 13px;
            font-weight: bold; 
            margin: 3px 0 2px 0;
            color: #2c5aa0;
        }
        
        .subtitle {
            font-size: 9px;
            color: #666;
            margin-bottom: 2px;
        }
        
        .info-box {
            border: 1px solid #ddd;
            padding: 8px;
            margin: 2px 0 6px 0;
            margin-top: 2px;
            border-radius: 3px;
            background-color: #f9f9f9;
            font-size: 10px;
            overflow: hidden;
            clear: both;
            position: relative;
            z-index: 2;
            line-height: 1.4;
        }
        
        .info-row {
            display: block;
            margin-bottom: 5px;
            line-height: 1.4;
            clear: left;
        }
        
        .info-row:after {
            content: "";
            display: table;
            clear: both;
        }
        
        .info-label {
            font-weight: bold;
            color: #555;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin: 6px 0 6px 0;
            margin-top: 6px;
            table-layout: fixed;
            clear: both;
        }
        
        /* Remover espaçamento entre linhas */
        tbody {
            margin: 0 !important;
            padding: 0 !important;
        }
        
        tr {
            margin: 0 !important;
            padding: 0 !important;
            border-spacing: 0 !important;
        }
        
        /* Garantir que não há espaço extra antes do total-row */
        tbody tr.total-row {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            padding-top: 0 !important;
            border-top: 1px solid #ccc !important;
        }
        
        /* Tabelas que vêm depois de section-title têm menos margem superior */
        .section-title + table {
            margin-top: 2px;
        }
        
        th, td {
            border: 1px solid #ccc;
            padding: 4px 6px 8px 6px;
            text-align: center;
            vertical-align: top;
            word-wrap: break-word;
            line-height: 1.3;
            font-size: 10px;
        }
        
        /* Valores monetários com fonte monospace */
        td.currency, .currency {
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }
        
        th {
            background-color: #e0eaf7;
            font-weight: bold;
            text-align: center;
            color: #2c5aa0;
            text-transform: uppercase;
            font-size: 9px;
            vertical-align: middle;
            padding: 6px;
            line-height: 1.4;
        }

        
        .section-title {
            font-size: 11px;
            font-weight: bold;
            margin: 4px 0 10px 0;
            margin-top: 4px;
            margin-bottom: 10px;
            color: #2c5aa0;
            border-bottom: 1px solid #2c5aa0;
            padding: 4px 0 5px 0;
            clear: both;
            position: relative;
            z-index: 3;
            line-height: 1.4;
        }
        
        .right { text-align: right !important; }
        .center { text-align: center !important; }
        .left { text-align: left !important; }
        
        .total-row { 
            background: #f0f5fa;
            font-weight: bold;
            color: #1565c0;
            font-size: 10px;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.3 !important;
        }
        
        .total-row td {
            padding: 4px 6px 8px 6px !important;
            margin: 0 !important;
            line-height: 1.3 !important;
            vertical-align: top !important;
        }
        
        .total-geral { 
            background: #2c5aa0 !important;
            color: white !important;
            font-weight: bold; 
            font-size: 11px;
        }
        
        .total-geral td {
            background: #2c5aa0 !important;
            color: white !important;
        }
        
        .footer { 
            margin-top: 10px;
            text-align: center; 
            font-size: 9px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 6px;
            line-height: 1.4;
        }
        
        .currency {
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }
        
        .no-data {
            text-align: center;
            width: 100%;
            display: block;
            color: #6c757d;
            font-style: italic;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 3px;
            margin-bottom: 4px;
            font-size: 10px;
            line-height: 1.4;
        }
        
        tr:nth-child(even) {
            background-color: #fcfdff;
        }
        
        .col-titular-descricao { width: 48%; min-width: 200px; text-align: left; }
        .col-titular-data { width: 12%; text-align: center; }
        .col-titular-valor { width: 14%; text-align: right; }
        
        .total-geral-valor { 
            font-size: 12px !important; 
            font-weight: bold;
        }

        .highlight {
            font-size: 10px;
            line-height: 1.4;
            margin: 6px 0;
            padding: 6px 8px;
            background: #f8f9fa;
            border-left: 2px solid #2c5aa0;
        }

        .resumo-compacto {
            margin-top: 4px;
        }
        
        .resumo-compacto table {
            margin: 2px 0;
        }
        
        .resumo-compacto th,
        .resumo-compacto td {
            padding: 4px 6px 8px 6px;
            font-size: 10px;
            line-height: 1.3;
            vertical-align: top;
        }
        
        .resumo-compacto tr.total-geral td {
            padding: 4px 6px 8px 6px !important;
            margin: 0 !important;
            line-height: 1.3 !important;
        }

        /* QUEBRA DE PÁGINA */
        @media print {
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
        }

        [style*="page-break-before: always"] {
          page-break-before: always !important;
          break-before: page !important;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="/images/logo-funsep-completa-relatorio.svg" alt="Logo FUNSEP">
        </div>
        <div class="title">${tituloRelatorio}</div>
        <div class="subtitle">Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}</div>
    </div>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Matrícula:</span>
            <span>${beneficiary.matricula}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Nome:</span>
            <span>${beneficiary.nome.toUpperCase()}</span>
        </div>
        <div class="info-row">
            <span class="info-label">CPF:</span>
            <span>${formatCPF(beneficiary.cpf)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Gerado em:</span>
            <span>${formatarDataHoraBrasilia(dataAtual)}</span>
        </div>
    </div>

    ${titular.length > 0 ? `
    <div class="section-title">${beneficiary.nome.toUpperCase()} (TITULAR)</div>
    <table>
        <thead>
            <tr>
                <th class="col-titular-descricao">Descrição</th>
                <th class="col-titular-data">Dt. Atend.</th>
                <th class="col-titular-data">Dt. Venc.</th>
                <th class="col-titular-valor">Vlr. Proced.</th>
                <th class="col-titular-valor">Vlr. Partic.</th>
            </tr>
        </thead>
        <tbody>
            ${titular.map(proc => `
            <tr>
                <td class="left">${proc.nome_beneficio}</td>
                <td class="center">${formatDate(proc.dtatend)}</td>
                <td class="center">${formatDate(proc.datavenc)}</td>
                <td class="right currency">R$ ${formatCurrency(proc.valorpago)}</td>
                <td class="right currency">R$ ${formatCurrency(proc.valorpart)}</td>
            </tr>
            `).join('')}
            <tr class="total-row">
                <td colspan="3" class="center"><strong>TOTAL TITULAR (${totais.titular.quantidade})</strong></td>
                <td class="right currency"><strong>R$ ${formatCurrency(totais.titular.procedimento)}</strong></td>
                <td class="right currency"><strong>R$ ${formatCurrency(totais.titular.participacao)}</strong></td>
            </tr>
        </tbody>
    </table>
    ` : `
    <div class="section-title">${beneficiary.nome.toUpperCase()} (TITULAR)</div>
    <div class="no-data">Nenhum procedimento encontrado para o titular.</div>
    `}

    ${Object.keys(procedimentosPorDependente).length > 0 ?
      Object.entries(procedimentosPorDependente).map(([nomeDependente, procs]) => {
        const totalProcedimento = procs.reduce((acc, proc) => acc + (parseCurrencyToCents(proc.valorpago as unknown as string | number) || 0), 0);
        const totalParticipacao = procs.reduce((acc, proc) => acc + (parseCurrencyToCents(proc.valorpart as unknown as string | number) || 0), 0);

        return `
        <div class="section-title">${nomeDependente.toUpperCase()} (DEPENDENTE)</div>
        <table>
            <thead>
                <tr>
                    <th class="col-titular-descricao">Descrição</th>
                    <th class="col-titular-data">Dt. Atend.</th>
                    <th class="col-titular-data">Dt. Venc.</th>
                    <th class="col-titular-valor">Vlr. Proced.</th>
                    <th class="col-titular-valor">Vlr. Partic.</th>
                </tr>
            </thead>
            <tbody>
                ${procs.map(proc => `
                <tr>
                    <td class="left">${proc.nome_beneficio}</td>
                    <td class="center">${formatDate(proc.dtatend)}</td>
                    <td class="center">${formatDate(proc.datavenc)}</td>
                    <td class="right currency">R$ ${formatCurrency(proc.valorpago)}</td>
                    <td class="right currency">R$ ${formatCurrency(proc.valorpart)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3" class="center"><strong>TOTAL ${nomeDependente.toUpperCase()} (${procs.length})</strong></td>
                    <td class="right currency"><strong>R$ ${formatCurrency(totalProcedimento)}</strong></td>
                    <td class="right currency"><strong>R$ ${formatCurrency(totalParticipacao)}</strong></td>
                </tr>
            </tbody>
        </table>
        `;
      }).join('')
    : `
    <div class="section-title">Dependentes</div>
    <div class="no-data">Nenhum procedimento encontrado para dependentes.</div>
    `}

    <div class="section-title resumo-compacto">Resumo</div>
    <table class="resumo-compacto">
        <thead>
            <tr>
                <th>Categoria</th>
                <th>Qtd.</th>
                <th>Vlr. Total</th>
                <th>Participação</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Titular</strong></td>
                <td class="center">${totais.titular.quantidade}</td>
                <td class="right currency">R$ ${formatCurrency(totais.titular.procedimento)}</td>
                <td class="right currency">R$ ${formatCurrency(totais.titular.participacao)}</td>
            </tr>
            <tr>
                <td><strong>Dependentes</strong></td>
                <td class="center">${totais.dependentes.quantidade}</td>
                <td class="right currency">R$ ${formatCurrency(totais.dependentes.procedimento)}</td>
                <td class="right currency">R$ ${formatCurrency(totais.dependentes.participacao)}</td>
            </tr>
            <tr class="total-geral">
                <td><strong>TOTAL</strong></td>
                <td class="center"><strong>${totais.geral.quantidade}</strong></td>
                <td class="right currency total-geral-valor"><strong>R$ ${formatCurrency(totais.geral.procedimento)}</strong></td>
                <td class="right currency total-geral-valor"><strong>R$ ${formatCurrency(totais.geral.participacao)}</strong></td>
            </tr>
        </tbody>
    </table>

    ${totais.geral.quantidade > 0 ? `
    <div class="highlight">
        <strong>Observações:</strong>
        Período: ${formatDate(dataInicio)} a ${formatDate(dataFim)}. 
        Valores conforme registros do sistema.
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO - CNPJ 77.750.354/0001-88</strong></p>
        <p>Gerado em ${formatarDataHoraBrasilia(dataAtual)} - Documento válido sem assinatura</p>
    </div>
</body>
</html>
  `
}

// Converter data numérica YYYYMMDD para formato Date
function parseYYYYMMDD(dateNum: string | number): Date | null {
  try {
    const dateStr = dateNum.toString().padStart(8, '0');
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  } catch (error) {
    console.error('Erro ao parsear YYYYMMDD:', dateNum, error);
    return null;
  }
}

// Converter data numérica DDMMYYYY para formato Date
function parseDDMMYYYY(dateNum: string | number): Date | null {
  try {
    const dateStr = dateNum.toString().padStart(8, '0');
    const day = parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4));
    const year = parseInt(dateStr.substring(4, 8));

    if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  } catch (error) {
    console.error('Erro ao parsear DDMMYYYY:', dateNum, error);
    return null;
  }
}

function formatDate(dateStr: string | number): string {
  if (!dateStr) return 'N/A';

  try {
    const dateStrNorm = dateStr.toString();

    // Se é formato numérico sem separadores
    if (/^\d{8}$/.test(dateStrNorm)) {
      // Tentar YYYYMMDD primeiro (datavenc)
      let date = parseYYYYMMDD(dateStrNorm);

      // Se falhar, tentar DDMMYYYY (dtatend)
      if (!date) {
        date = parseDDMMYYYY(dateStrNorm);
      }

      if (date) {
        return date.toLocaleDateString('pt-BR');
      }
    }

    // Se é formato YYYY-MM-DD
    if (dateStrNorm.includes('-')) {
      const [year, month, day] = dateStrNorm.split('-').map(Number);
      if (year && month && day) {
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('pt-BR');
      }
    }

    return dateStrNorm;
  } catch (error) {
    console.error('Erro ao formatar data:', dateStr, error);
    return dateStr.toString();
  }
}

function formatCurrency(value: number): string {
  // Os valores no banco estão armazenados em centavos (ex: 10295 = R$ 102,95)
  // Dividir por 100 para converter centavos para reais
  const valorEmReais = (value || 0) / 100;
  return valorEmReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCPF(cpf: string | number): string {
  const cpfStr = cpf.toString().padStart(11, '0')
  return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCurrencyText(value: number): string {
  // Os valores no banco estão em centavos, converter para reais primeiro
  const valorEmReais = (value || 0) / 100;
  const integerPart = Math.floor(valorEmReais)
  const decimalPart = Math.round((valorEmReais - integerPart) * 100)
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dez = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
  
  function numeroParaTexto(num: number): string {
    if (num === 0) return 'zero'
    if (num === 100) return 'cem'
    
    let texto = ''
    
    // Centenas
    const c = Math.floor(num / 100)
    if (c > 0) {
      texto += centenas[c]
      num = num % 100
      if (num > 0) texto += ' e '
    }
    
    // Dezenas e unidades
    if (num >= 10 && num < 20) {
      texto += dez[num - 10]
    } else {
      const d = Math.floor(num / 10)
      const u = num % 10
      
      if (d > 0) {
        texto += dezenas[d]
        if (u > 0) texto += ' e '
      }
      if (u > 0) {
        texto += unidades[u]
      }
    }
    
    return texto
  }
  
  if (integerPart === 0) {
    const centavosTexto = decimalPart === 0 ? 'zero' : numeroParaTexto(decimalPart)
    return `zero reais e ${centavosTexto} centavos`
  }
  
  let resultado = ''
  
  // Milhões
  const milhoes = Math.floor(integerPart / 1000000)
  if (milhoes > 0) {
    resultado += numeroParaTexto(milhoes)
    resultado += milhoes === 1 ? ' milhão' : ' milhões'
    const resto = integerPart % 1000000
    if (resto > 0) {
      if (resto < 100) {
        resultado += ' e '
      } else {
        resultado += ', '
      }
    }
  }
  
  // Milhares
  const milhares = Math.floor((integerPart % 1000000) / 1000)
  if (milhares > 0) {
    resultado += numeroParaTexto(milhares) + ' mil'
    const centenas_resto = integerPart % 1000
    if (centenas_resto > 0) {
      if (centenas_resto < 100) {
        resultado += ' e '
      } else {
        resultado += ', '
      }
    }
  }
  
  // Centenas
  const centenas_final = integerPart % 1000
  if (centenas_final > 0 || (milhares === 0 && milhoes === 0)) {
    resultado += numeroParaTexto(centenas_final)
  }
  
  resultado += integerPart === 1 ? ' real' : ' reais'
  
  // Centavos por extenso
  const centavosTexto = decimalPart === 0 ? 'zero' : numeroParaTexto(decimalPart)
  resultado += ` e ${centavosTexto} centavos`
  
  return resultado
}

async function generateMensalidadesReport(supabase: any, beneficiary: any, matricula: number, ano: number, geradoPorMatricula?: number, geradoPorSigla?: string) {
  try {
    console.log('Gerando relatório de Mensalidades para:', { matricula, ano })
    
    // 1. Buscar dados da tabela relmensanual
    const { data: mensalidadesData, error: mensalidadesError } = await supabase
      .from('relmensanual')
      .select('*')
      .eq('matfuns', matricula)
      .eq('ano', ano)
      .order('nrodep')
    
    if (mensalidadesError) {
      console.error('Erro ao buscar mensalidades:', mensalidadesError)
      throw new Error('Erro ao buscar dados de mensalidades')
    }
    
    if (!mensalidadesData || mensalidadesData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum dado de mensalidade encontrado para o ano selecionado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 2. Buscar dependentes para obter nomes e relações
    const { data: dependentesData, error: dependentesError } = await supabase
      .from('caddep')
      .select('nrodep, nome, graudep')
      .eq('matricula', matricula)
    
    const dependentesMap = new Map()
    if (dependentesData && !dependentesError) {
      dependentesData.forEach(dep => {
        // Converter nrodep para string e remover espaços para garantir comparação correta
        const nrodepKey = String(dep.nrodep || '').trim()
        dependentesMap.set(nrodepKey, { nome: dep.nome, graudep: dep.graudep })
        console.log(`[Mensalidades] Adicionado ao Map: nrodep='${nrodepKey}', nome='${dep.nome}', graudep='${dep.graudep}'`)
      })
    }
    console.log(`[Mensalidades] Total de dependentes no Map: ${dependentesMap.size}`)
    
    // 3. Processar dados - separar titular e dependentes
    const titular = mensalidadesData.find(item => item.nrodep === 0 || item.nrodep === '0')
    const dependentes = mensalidadesData.filter(item => item.nrodep !== 0 && item.nrodep !== '0' && item.nrodep !== '')
    
    if (!titular) {
      return new Response(
        JSON.stringify({ error: 'Dados do titular não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 4. Gerar HTML do relatório
    const calcularTotalMensalidadeCentavos = (registro: any): number => {
      const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
      const totalReais = meses.reduce((acc, mes) => acc + safeNumber(registro?.[mes]), 0)
      return Math.round(totalReais * 100)
    }

    const totalTitularCentavos = calcularTotalMensalidadeCentavos(titular)
    const totalDependentesCentavos = dependentes.reduce((acc, dep) => acc + calcularTotalMensalidadeCentavos(dep), 0)
    const totalGeralCentavos = totalTitularCentavos + totalDependentesCentavos
    const detalhesRelatorio = {
      totais_centavos: {
        titular: { total: totalTitularCentavos },
        dependentes: { total: totalDependentesCentavos, quantidade: dependentes.length },
        geral: { total: totalGeralCentavos }
      }
    }

    const htmlContent = generateMensalidadesReportHTML(
      beneficiary,
      titular,
      dependentes,
      dependentesMap,
      ano
    )
    
    const filename = `MENSALIDADES_${beneficiary.nome.replace(/[^A-Z0-9]/gi, '_')}_${matricula}_${ano}.pdf`
    
    // 5. Gerar token único e salvar no banco
    const token = crypto.randomUUID()
    const htmlWithToken = htmlContent.replace(
      '</body>',
      `<div style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 5px;">
        <p style="margin: 0; font-size: 12px; color: #666;"><strong>Token de Validação:</strong></p>
        <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 11px; color: #333; word-break: break-all;">${token}</p>
      </div></body>`
    )
    
    const { error: tokenError } = await supabase
      .from('relatorio_tokens')
      .insert({
        token,
        matricula,
        tipo_relatorio: 'mensalidades',
        data_inicio: `${ano}-01-01`,
        data_fim: `${ano}-12-31`,
        gerado_por_matricula: geradoPorMatricula,
        gerado_por_sigla: geradoPorSigla,
        valor_total_centavos: totalGeralCentavos,
        detalhes_relatorio: detalhesRelatorio,
        html_content: htmlWithToken,
        filename
      })
    
    if (tokenError) {
      console.error('Erro ao salvar token Mensalidades:', tokenError)
    } else {
      console.log('Token Mensalidades gerado e salvo com sucesso:', token)
    }
    
    return new Response(JSON.stringify({ 
      html: htmlWithToken,
      filename,
      token
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error) {
    console.error('Erro geral ao gerar relatório de Mensalidades:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar relatório de Mensalidades', details: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function generateMensalidadesReportHTML(
  beneficiary: any,
  titular: any,
  dependentes: any[],
  dependentesMap: Map<string, { nome: string, graudep: string }>,
  ano: number
): string {
  const meses = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  // Função para converter valor para número (valores já estão em reais, não em centavos)
  const parseValor = (valor: string | number | null | undefined): number => {
    if (!valor) return 0
    if (typeof valor === 'number') return valor
    // Se for string, tentar converter para número
    const num = parseNumberBR(String(valor))
    return num
  }
  
  // Função para formatar valor em reais (valores já estão em reais diretos)
  const formatValorMensalidade = (valor: string | number | null | undefined): string => {
    const valorReais = parseValor(valor)
    // Formatar com ponto como separador de milhar e vírgula como separador decimal
    return valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  
  // Calcular total de uma pessoa em reais
  const calcularTotalReais = (pessoa: any): number => {
    let total = 0
    meses.forEach(mes => {
      total += parseValor(pessoa[mes])
    })
    return total
  }
  
  // Processar titular
  const totalTitularReais = calcularTotalReais(titular)
  const valoresTitular = meses.map(mes => formatValorMensalidade(titular[mes]))
  
  // Processar dependentes
  const dependentesProcessados = dependentes.map(dep => {
    // Normalizar nrodep - tentar múltiplos formatos para garantir match
    const nrodepRaw = dep.nrodep
    const nrodepNum = Number(nrodepRaw)
    const nrodepStr1 = String(nrodepNum || nrodepRaw || '').trim()
    const nrodepStr2 = String(nrodepRaw || '').trim()

    // Buscar no Map com diferentes chaves
    let depInfo = dependentesMap.get(nrodepStr1) || dependentesMap.get(nrodepStr2) || dependentesMap.get(String(nrodepNum))

    // Nome do dependente: SEMPRE do caddep se encontrado
    const nomeDep = depInfo?.nome || dep.nome || `Dependente ${dep.nrodep}`

    // Grau de dependência: PRIMEIRO tentar da relmensanual (já vem como TEXTO),
    // depois tentar do caddep como fallback
    const graudepRelmens = String(dep.graudep || '').trim().toUpperCase()
    const graudepCaddep = depInfo?.graudep

    // Se relmensanual já tem o graudep como texto (ex: "ESPOSA", "FILHO"), usar direto
    let grauTexto = ''
    if (graudepRelmens && graudepRelmens !== '' && graudepRelmens !== '0') {
      // Já vem como texto da relmensanual
      grauTexto = graudepRelmens
      console.log(`[Mensalidades] Usando graudep da relmensanual: '${grauTexto}' para dependente ${dep.nrodep}`)
    } else if (graudepCaddep) {
      // Fallback: mapear do caddep se necessário
      const graudep = String(graudepCaddep).trim()
      const graudepText: Record<string, string> = {
        '1': 'ESPOSA',
        '2': 'FILHO',
        '3': 'FILHA',
        '4': 'PAI',
        '5': 'MAE',
        '6': 'OUTROS'
      }
      grauTexto = graudepText[graudep] || ''
      console.log(`[Mensalidades] Usando graudep mapeado do caddep: '${grauTexto}' para dependente ${dep.nrodep}`)
    }

    // Formato: NOME - GRAU (igual ao PDF de exemplo: "JOSEFA LENIRA BIZETO MAZUR - ESPOSA")
    const nomeCompleto = grauTexto ? `${nomeDep.toUpperCase()} - ${grauTexto}` : nomeDep.toUpperCase()
    
    const totalReais = calcularTotalReais(dep)
    const valores = meses.map(mes => formatValorMensalidade(dep[mes]))
    
    return {
      nome: nomeCompleto,
      valores,
      totalReais
    }
  })
  
  // Calcular total geral em reais
  const totalGeralReais = totalTitularReais + dependentesProcessados.reduce((acc, dep) => acc + dep.totalReais, 0)
  const totalGeralCentavos = Math.round(totalGeralReais * 100) // Converter para centavos para formatCurrencyText
  const totalGeralTexto = formatCurrencyText(totalGeralCentavos) // formatCurrencyText espera centavos
  
  const dataAtual = getDataHoraBrasilia()
  const nomeTitular = titular.nome || beneficiary.nome
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relação de Mensalidades FUNSEP - ${beneficiary.matricula}</title>
    <style>
      @page {
        margin: 15mm 12mm 20mm 12mm;
        size: A4 portrait;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 8px 8px 20px 8px;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: #fff;
        box-sizing: border-box;
        width: 186mm;
        max-width: 186mm;
        max-height: 257mm;
        overflow: visible;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .header {
        text-align: center;
        margin-bottom: 15px;
        border-bottom: 2px solid #2c5aa0;
        padding: 10px 4px 8px 4px;
      }

      .logo {
        margin-bottom: 5px;
        text-align: center;
      }

      .logo img {
        width: 280px;
        max-width: 90%;
        height: auto;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      }

      .title {
        font-size: 17px;
        font-weight: bold;
        margin: 6px 0;
        color: #2c5aa0;
      }
      
      .info-text {
        text-align: justify;
        margin: 15px 0;
        font-size: 11px;
        line-height: 1.6;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #333 !important;
      }
      .declaracao-text {
        text-align: justify;
        margin: 20px 0;
        line-height: 1.6;
        font-size: 12px;
        display: block !important;
        clear: both;
        color: #222 !important;
        background: none !important;
        font-weight: 500;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 10px;
        page-break-inside: avoid;
      }

      .tabela-dependente {
        margin-top: 60px !important;
        margin-bottom: 15px !important;
      }

      .separador-dependente {
        height: 60px;
        border-bottom: 3px solid #2c5aa0;
        margin: 30px 0;
        page-break-after: avoid;
        display: block;
        clear: both;
      }
      
      th, td { 
        border: 1px solid #000;
        padding: 6px 4px;
        text-align: center;
        line-height: 1.3;
        vertical-align: middle;
      }
      
      th { 
        background-color: #f0f0f0;
        font-weight: bold; 
        font-size: 9px;
        padding: 7px 4px;
      }
      
      .pessoa-nome {
        background-color: #e8e8e8;
        font-weight: bold;
        text-align: left !important;
        padding-left: 8px !important;
      }
      
      .total-row {
        background: #d0d0d0;
        font-weight: bold;
        font-size: 11px;
      }
      
      .valor-cell {
        font-family: 'Courier New', monospace;
        text-align: right !important;
        padding-right: 6px !important;
      }
      
      .footer { 
        margin-top: 30px;
        text-align: center; 
        font-size: 11px;
        color: #6c757d;
        border-top: 1px solid #dee2e6;
        padding-top: 15px;
      }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="/images/logo-funsep-completa-relatorio.svg" alt="Logo FUNSEP">
        </div>
    </div>

    <div style="text-align: right; margin-bottom: 15px; font-size: 12px;">
      Curitiba, ${formatarDataHoraBrasilia(dataAtual).split(' ')[0]}.
    </div>
    
    <div class="declaracao-text">
      Informo que o servidor <strong>${nomeTitular.toUpperCase()}</strong>, matrícula ${beneficiary.matricula}, associado deste FUNSEP (CNPJ 77.750.354/0001-88), descontou os seguintes valores de mensalidades no período de janeiro a dezembro de ${ano}:
    </div>

    <!-- Tabela Titular -->
    <table>
        <thead>
            <tr>
                <th colspan="12" class="pessoa-nome">${nomeTitular.toUpperCase()} - TITULAR</th>
            </tr>
            <tr>
                ${mesesAbrev.map((mes, idx) => `<th>${mes}/${String(ano).slice(-2)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                ${valoresTitular.map(valor => `<td class="valor-cell">${valor}</td>`).join('')}
            </tr>
            <tr class="total-row">
                <td colspan="10"></td>
                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="10"></td>
                <td colspan="2" class="valor-cell"><strong>${formatValorMensalidade(totalTitularReais)}</strong></td>
            </tr>
        </tbody>
    </table>

    ${dependentesProcessados.map((dep, idx) => `
    <!-- Separador entre tabelas de dependentes -->
    <div class="separador-dependente"></div>

    <!-- Tabela Dependente -->
    <table class="tabela-dependente">
        <thead>
            <tr>
                <th colspan="12" class="pessoa-nome">${dep.nome.toUpperCase()}</th>
            </tr>
            <tr>
                ${mesesAbrev.map((mes, idx) => `<th>${mes}/${String(ano).slice(-2)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                ${dep.valores.map(valor => `<td class="valor-cell">${valor}</td>`).join('')}
            </tr>
            <tr class="total-row">
                <td colspan="10"></td>
                <td colspan="2" style="text-align: center;"><strong>Total</strong></td>
            </tr>
            <tr class="total-row">
                <td colspan="10"></td>
                <td colspan="2" class="valor-cell"><strong>${formatValorMensalidade(dep.totalReais)}</strong></td>
            </tr>
        </tbody>
    </table>
    `).join('')}

    <div class="declaracao-text" style="margin-top: 25px; text-align: center; font-weight: bold; font-size: 12px;">
        Total Geral: ${formatValorMensalidade(totalGeralReais)} (${totalGeralTexto})
    </div>

    <div class="footer">
        <p><strong>FUNDO DE SAÚDE DOS SERVIDORES DO PODER JUDICIÁRIO - CNPJ 77.750.354/0001-88</strong></p>
        <p>Gerado em ${formatarDataHoraBrasilia(dataAtual)} - Documento válido sem assinatura</p>
    </div>
</body>
</html>
  `
}
