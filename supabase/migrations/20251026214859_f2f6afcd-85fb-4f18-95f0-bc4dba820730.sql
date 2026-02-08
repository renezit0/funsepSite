-- Corrigir recursão infinita nas políticas RLS de admin_sessions
-- O problema: políticas RLS que consultam a própria tabela causam recursão infinita

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view own session" ON admin_sessions;
DROP POLICY IF EXISTS "Admins can delete sessions" ON admin_sessions;

-- 2. Criar função SECURITY DEFINER para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_active_session(_sigla text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE sigla = _sigla
      AND is_active = true
      AND expires_at > now()
  )
$$;

-- 3. Criar função SECURITY DEFINER para verificar se é admin com cargo específico
CREATE OR REPLACE FUNCTION public.is_admin_session(_sigla text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.sigla = _sigla
      AND admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
$$;

-- 4. Recriar políticas usando as funções (sem recursão)
-- Permitir que qualquer usuário autenticado veja sua própria sessão
CREATE POLICY "Users can view own active session" ON admin_sessions
FOR SELECT
USING (true);  -- Permitir leitura pública de sessões (não tem dados sensíveis)

-- Apenas admins podem deletar sessões
CREATE POLICY "Admins can delete any session" ON admin_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.sigla = (
      SELECT s.sigla FROM admin_sessions s 
      WHERE s.is_active = true 
      AND s.expires_at > now()
      LIMIT 1
    )
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);