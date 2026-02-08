-- Corrigir políticas RLS para noticias e sobre_funsep
-- O problema é que políticas ALL podem estar interferindo com acesso público

-- 1. NOTICIAS: Recriar políticas mais explícitas
DROP POLICY IF EXISTS "Admins podem gerenciar todas as notícias" ON noticias;
DROP POLICY IF EXISTS "Notícias publicadas são visíveis para todos" ON noticias;

-- Política de SELECT para todos (publicado = true)
CREATE POLICY "Public can view published noticias" ON noticias
FOR SELECT
USING (publicado = true);

-- Políticas separadas para admins
CREATE POLICY "Admins can view all noticias" ON noticias
FOR SELECT
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

CREATE POLICY "Admins can insert noticias" ON noticias
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admins can update noticias" ON noticias
FOR UPDATE
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

CREATE POLICY "Admins can delete noticias" ON noticias
FOR DELETE
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

-- 2. SOBRE_FUNSEP: Recriar políticas mais explícitas
DROP POLICY IF EXISTS "Admins podem gerenciar todas as seções" ON sobre_funsep;
DROP POLICY IF EXISTS "Seções publicadas são visíveis para todos" ON sobre_funsep;

-- Política de SELECT para todos (publicado = true)
CREATE POLICY "Public can view published sobre_funsep" ON sobre_funsep
FOR SELECT
USING (publicado = true);

-- Políticas separadas para admins
CREATE POLICY "Admins can view all sobre_funsep" ON sobre_funsep
FOR SELECT
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

CREATE POLICY "Admins can insert sobre_funsep" ON sobre_funsep
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admins can update sobre_funsep" ON sobre_funsep
FOR UPDATE
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

CREATE POLICY "Admins can delete sobre_funsep" ON sobre_funsep
FOR DELETE
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