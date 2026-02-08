import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface ValidatedUser {
  sigla: string
  nome: string
  cargo: string
  secao: string
  matricula?: number
}

export interface ValidationResult {
  success: boolean
  user?: ValidatedUser
  error?: string
}

/**
 * Valida o token e retorna os dados reais do usuário do banco de dados
 * NUNCA confie nos dados enviados pelo cliente - sempre busque do banco
 */
export async function validateToken(
  supabase: SupabaseClient,
  token: string
): Promise<ValidationResult> {
  if (!token) {
    return { success: false, error: 'Token não fornecido' }
  }

  try {
    // Buscar sessão ativa
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

    // Verificar se é admin ou beneficiário
    const isAdmin = !session.sigla.startsWith('BEN-')

    if (isAdmin) {
      // Buscar dados reais do admin do banco
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
      // Beneficiário
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
export function hasRequiredRole(user: ValidatedUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.cargo)
}

/**
 * Extrai o token do header Authorization
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  // Formato: "Bearer <token>"
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}
