import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoginRequest {
  cpf: string
  senha: string
}

const normalizeCpf = (value: string | null | undefined): string => {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(11, '0').slice(-11)
}

const formatCpf = (digits: string): string => {
  if (!digits || digits.length !== 11) return digits
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const cpfVariants = (value: string): string[] => {
  const normalized = normalizeCpf(value)
  if (!normalized) return []

  const compact = normalized.replace(/^0+/, '') || '0'
  const values = [
    normalized,
    compact,
    formatCpf(normalized)
  ]

  // Caso exista CPF legado sem zero à esquerda com pontuação
  if (compact.length === 11) {
    values.push(formatCpf(compact))
  }

  return [...new Set(values.filter(Boolean))]
}

const cpfNumberVariants = (value: string): number[] => {
  const normalized = normalizeCpf(value)
  if (!normalized) return []

  const variants = [
    Number.parseInt(normalized, 10),
    Number.parseInt(normalized.replace(/^0+/, '') || '0', 10)
  ].filter((item) => Number.isFinite(item))

  return [...new Set(variants)]
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
    const normalizedCpf = normalizeCpf(cpf)

    if (!normalizedCpf || !senha) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Tentativa de login:', { cpf: normalizedCpf })

    const cpfSearchValues = cpfVariants(normalizedCpf)

    // Verificar se é admin
    const { data: adminUsers, error: adminError } = await supabase
      .from('usuarios')
      .select('sigla, nome, cargo, secao, senha')
      .in('cpf', cpfSearchValues)
      .limit(10)

    if (adminError) {
      console.error('Erro ao buscar admin:', adminError)
    }

    let adminUser = null
    if (adminUsers && adminUsers.length > 0) {
      for (const user of adminUsers) {
        const passwordOk = await verifyPassword(senha, user.senha, async (plainPassword) => {
          await supabase
            .from('usuarios')
            .update({ senha: plainPassword })
            .eq('sigla', user.sigla)
        }, supabase)

        if (passwordOk) {
          adminUser = user
          break
        }
      }
    }

    if (adminUser) {
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
    const { data: senhaRecords, error: senhaError } = await supabase
      .from('senhas')
      .select('*')
      .in('cpf', cpfSearchValues)
      .limit(20)

    if (senhaError) {
      console.error('Erro ao verificar senha:', senhaError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na autenticação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let senhaRecord = null
    if (senhaRecords && senhaRecords.length > 0) {
      for (const record of senhaRecords) {
        const passwordOk = await verifyPassword(senha, record.senha, async (plainPassword) => {
          await supabase
            .from('senhas')
            .update({ senha: plainPassword })
            .eq('id', record.id)
        }, supabase)

        if (passwordOk) {
          senhaRecord = record
          break
        }
      }
    }

    // Fallback para bases legadas: localizar por CPF em cadben e autenticar pela matrícula
    if (!senhaRecord) {
      const cpfNumbers = cpfNumberVariants(normalizedCpf)

      if (cpfNumbers.length > 0) {
        const { data: beneficiariosByCpf, error: benByCpfError } = await supabase
          .from('cadben')
          .select('matricula')
          .in('cpf', cpfNumbers)
          .limit(30)

        if (benByCpfError) {
          console.error('Erro ao buscar beneficiário por CPF (fallback):', benByCpfError)
        } else if (beneficiariosByCpf && beneficiariosByCpf.length > 0) {
          const matriculas = [...new Set(
            beneficiariosByCpf
              .map((item) => item.matricula)
              .filter((item) => item !== null && item !== undefined)
          )]

          if (matriculas.length > 0) {
            const { data: senhaByMatricula, error: senhaByMatriculaError } = await supabase
              .from('senhas')
              .select('*')
              .in('matricula', matriculas)
              .limit(50)

            if (senhaByMatriculaError) {
              console.error('Erro ao buscar senha por matrícula (fallback):', senhaByMatriculaError)
            } else if (senhaByMatricula && senhaByMatricula.length > 0) {
              for (const record of senhaByMatricula) {
                const passwordOk = await verifyPassword(senha, record.senha, async (plainPassword) => {
                  await supabase
                    .from('senhas')
                    .update({ senha: plainPassword })
                    .eq('id', record.id)
                }, supabase)

                if (passwordOk) {
                  senhaRecord = record
                  break
                }
              }
            }
          }
        }
      }
    }

    if (!senhaRecord) {
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
