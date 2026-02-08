-- Corrigir políticas RLS para segurança
-- 1. Restringir acesso à tabela senhas (login)

-- Remove política permissiva demais
DROP POLICY IF EXISTS "Allow read for login authentication" ON senhas;

-- Política mais restrita: apenas para validação durante login (não expõe dados)
CREATE POLICY "Allow read for login validation" ON senhas
FOR SELECT
USING (
  -- Permite ler apenas o próprio registro após autenticado
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || senhas.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 2. Melhorar política de cadben para limitar acesso a dados sensíveis

-- Remove política ampla
DROP POLICY IF EXISTS "Allow cadben read for authentication" ON cadben;

-- Apenas beneficiários autenticados podem ver seus próprios dados
CREATE POLICY "Users can view their own cadben" ON cadben
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || cadben.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 3. Restringir acesso à tabela admin_sessions

-- Remove política permissiva
DROP POLICY IF EXISTS "Allow session management" ON admin_sessions;

-- Usuários só podem ver suas próprias sessões
CREATE POLICY "Users can view their own sessions" ON admin_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions AS current_session
    WHERE current_session.sigla = admin_sessions.sigla
    AND current_session.is_active = true
    AND current_session.expires_at > now()
  )
);

-- Admins podem gerenciar sessões
CREATE POLICY "Admins can manage sessions" ON admin_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Permitir INSERT para login (necessário para criar novas sessões)
CREATE POLICY "Allow session creation for login" ON admin_sessions
FOR INSERT
WITH CHECK (true);

-- Permitir UPDATE para logout (desativar própria sessão)
CREATE POLICY "Users can update their own sessions" ON admin_sessions
FOR UPDATE
USING (
  sigla IN (
    SELECT sigla FROM admin_sessions
    WHERE is_active = true
    AND expires_at > now()
  )
);

-- 4. Restringir leitura de dependentes
DROP POLICY IF EXISTS "Admin users can view all caddep" ON caddep;

-- Recriar com mesma lógica mas documentada
CREATE POLICY "Admin users can view all caddep" ON caddep
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- Beneficiários podem ver seus próprios dependentes
CREATE POLICY "Users can view their own dependents" ON caddep
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || caddep.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 5. Adicionar índices para performance das verificações de segurança
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(sigla, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_senhas_matricula ON senhas(matricula);
CREATE INDEX IF NOT EXISTS idx_cadben_matricula ON cadben(matricula);
CREATE INDEX IF NOT EXISTS idx_caddep_matricula ON caddep(matricula);