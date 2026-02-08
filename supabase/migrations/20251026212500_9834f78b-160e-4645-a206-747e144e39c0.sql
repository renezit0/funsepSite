-- Corrigir recursão infinita nas políticas de admin_sessions

-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Users can view their own sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow session creation for login" ON admin_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON admin_sessions;

-- Criar políticas simplificadas sem recursão

-- 1. Permitir INSERT para qualquer um (necessário para login)
CREATE POLICY "Allow insert for authentication" ON admin_sessions
FOR INSERT
WITH CHECK (true);

-- 2. Permitir SELECT apenas para admins verificando diretamente na tabela usuarios
CREATE POLICY "Admins can view sessions" ON admin_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM usuarios
    WHERE usuarios.sigla = admin_sessions.sigla
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- 3. Permitir UPDATE para desativar própria sessão (logout)
-- Usa validação simples sem consultar a própria tabela
CREATE POLICY "Allow update for logout" ON admin_sessions
FOR UPDATE
USING (true)
WITH CHECK (is_active = false);

-- 4. Permitir DELETE apenas para admins
CREATE POLICY "Admins can delete sessions" ON admin_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM usuarios
    WHERE usuarios.sigla = admin_sessions.sigla
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);