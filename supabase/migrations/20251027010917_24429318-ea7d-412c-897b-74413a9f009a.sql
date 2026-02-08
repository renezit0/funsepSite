-- Create a function to check if there's ANY active admin session
-- This is not perfect but better than allowing everyone
CREATE OR REPLACE FUNCTION public.has_active_admin_session()
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
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Full access cadben" ON cadben;
DROP POLICY IF EXISTS "Full access caddep" ON caddep;
DROP POLICY IF EXISTS "Allow all operations cadben" ON cadben;
DROP POLICY IF EXISTS "Allow all operations caddep" ON caddep;
DROP POLICY IF EXISTS "Allow all operations mgumrr" ON mgumrr;
DROP POLICY IF EXISTS "Allow all operations mgumrrapg" ON mgumrrapg;
DROP POLICY IF EXISTS "Allow all operations relatorio_tokens" ON relatorio_tokens;
DROP POLICY IF EXISTS "Allow all operations requerimentos" ON requerimentos;
DROP POLICY IF EXISTS "Allow all operations senhas" ON senhas;
DROP POLICY IF EXISTS "Allow all operations usuarios" ON usuarios;
DROP POLICY IF EXISTS "Allow all operations noticias" ON noticias;
DROP POLICY IF EXISTS "Allow all operations sobre_funsep" ON sobre_funsep;

-- Create policies that require an active admin session
CREATE POLICY "Require active admin session cadben"
ON cadben FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session caddep"
ON caddep FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session mgumrr"
ON mgumrr FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session mgumrrapg"
ON mgumrrapg FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session irpfd"
ON irpfd FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session irpft"
ON irpft FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session irpfdb"
ON irpfdb FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session irpftb"
ON irpftb FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session relatorio_tokens"
ON relatorio_tokens FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session requerimentos"
ON requerimentos FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session senhas"
ON senhas FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session usuarios"
ON usuarios FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Require active admin session tabbeneficios"
ON tabbeneficios FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session tabempresas"
ON tabempresas FOR SELECT
USING (public.has_active_admin_session());

CREATE POLICY "Require active admin session tabgrpar"
ON tabgrpar FOR SELECT
USING (public.has_active_admin_session());

-- For noticias and sobre_funsep, allow public read of published items
-- but require admin session for write operations
CREATE POLICY "Public can read published noticias"
ON noticias FOR SELECT
USING (publicado = true);

CREATE POLICY "Require active admin session for noticias management"
ON noticias FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());

CREATE POLICY "Public can read published sobre_funsep"
ON sobre_funsep FOR SELECT
USING (publicado = true);

CREATE POLICY "Require active admin session for sobre_funsep management"
ON sobre_funsep FOR ALL
USING (public.has_active_admin_session())
WITH CHECK (public.has_active_admin_session());