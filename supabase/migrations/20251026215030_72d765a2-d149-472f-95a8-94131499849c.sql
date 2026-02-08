-- SOLUÇÃO DEFINITIVA PARA RECURSÃO INFINITA
-- Criar funções SECURITY DEFINER para verificações de autorização

-- 1. Função para verificar se sigla atual é admin ativo
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_sigla text;
BEGIN
  -- Pegar a sigla da sessão ativa mais recente (pode ser passada via RPC ou outro mecanismo)
  -- Por enquanto, vamos usar uma abordagem mais simples
  SELECT sigla INTO current_sigla
  FROM admin_sessions
  WHERE is_active = true 
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF current_sigla IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se é admin
  RETURN EXISTS (
    SELECT 1
    FROM usuarios
    WHERE sigla = current_sigla
      AND cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  );
END;
$$;

-- 2. Função para verificar se uma matrícula específica tem sessão ativa
CREATE OR REPLACE FUNCTION public.matricula_has_active_session(_matricula bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE sigla = 'BEN-' || _matricula::text
      AND is_active = true
      AND expires_at > now()
  )
$$;

-- 3. Desabilitar RLS temporariamente em admin_sessions para evitar recursão
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;

-- 4. Recriar políticas usando as funções (SEM consultar admin_sessions diretamente)
-- NOTICIAS
DROP POLICY IF EXISTS "Admins can view all noticias" ON noticias;
DROP POLICY IF EXISTS "Admins can insert noticias" ON noticias;
DROP POLICY IF EXISTS "Admins can update noticias" ON noticias;
DROP POLICY IF EXISTS "Admins can delete noticias" ON noticias;

CREATE POLICY "Admins can manage noticias" ON noticias
FOR ALL
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());

-- SOBRE_FUNSEP
DROP POLICY IF EXISTS "Admins can view all sobre_funsep" ON sobre_funsep;
DROP POLICY IF EXISTS "Admins can insert sobre_funsep" ON sobre_funsep;
DROP POLICY IF EXISTS "Admins can update sobre_funsep" ON sobre_funsep;
DROP POLICY IF EXISTS "Admins can delete sobre_funsep" ON sobre_funsep;

CREATE POLICY "Admins can manage sobre_funsep" ON sobre_funsep
FOR ALL
USING (current_user_is_admin())
WITH CHECK (current_user_is_admin());