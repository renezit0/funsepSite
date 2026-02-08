-- Create function to get current admin sigla from custom header
CREATE OR REPLACE FUNCTION public.get_current_admin_sigla()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.headers', true)::json->>'x-admin-sigla';
$$;

-- Create function to get current admin token from custom header  
CREATE OR REPLACE FUNCTION public.get_current_admin_token()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.headers', true)::json->>'x-admin-token';
$$;

-- Create function to verify if current request is from an authenticated admin
CREATE OR REPLACE FUNCTION public.is_authenticated_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.token = public.get_current_admin_token()
      AND admin_sessions.sigla = public.get_current_admin_sigla()
      AND admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  );
$$;

-- Drop existing policies that are failing
DROP POLICY IF EXISTS "Admin users can view all cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can insert cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can update cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can delete cadben" ON cadben;

DROP POLICY IF EXISTS "Admin users can view all caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can insert caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can update caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can delete caddep" ON caddep;

DROP POLICY IF EXISTS "Admin users can view all mgumrr" ON mgumrr;
DROP POLICY IF EXISTS "Admin users can insert mgumrr" ON mgumrr;
DROP POLICY IF EXISTS "Admin users can update mgumrr" ON mgumrr;
DROP POLICY IF EXISTS "Admin users can delete mgumrr" ON mgumrr;

DROP POLICY IF EXISTS "Admin users can view all mgumrrapg" ON mgumrrapg;
DROP POLICY IF EXISTS "Admin users can insert mgumrrapg" ON mgumrrapg;
DROP POLICY IF EXISTS "Admin users can update mgumrrapg" ON mgumrrapg;
DROP POLICY IF EXISTS "Admin users can delete mgumrrapg" ON mgumrrapg;

DROP POLICY IF EXISTS "Admin users can view all irpfd" ON irpfd;
DROP POLICY IF EXISTS "Admin users can view all irpft" ON irpft;
DROP POLICY IF EXISTS "Admin users can view irpfdb" ON irpfdb;
DROP POLICY IF EXISTS "Admin users can view irpftb" ON irpftb;

DROP POLICY IF EXISTS "Admins can manage noticias" ON noticias;
DROP POLICY IF EXISTS "Admins can manage sobre_funsep" ON sobre_funsep;

DROP POLICY IF EXISTS "Admin users can view all tokens" ON relatorio_tokens;
DROP POLICY IF EXISTS "Admin users can insert tokens" ON relatorio_tokens;

DROP POLICY IF EXISTS "Admin users can view all requerimentos" ON requerimentos;
DROP POLICY IF EXISTS "Admin users can update requerimentos" ON requerimentos;

DROP POLICY IF EXISTS "Admin users can manage all senhas" ON senhas;

DROP POLICY IF EXISTS "Admin users can insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin users can update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin users can delete usuarios" ON usuarios;

DROP POLICY IF EXISTS "Admin users can view all reference tables" ON tabbeneficios;
DROP POLICY IF EXISTS "Admin users can view all reference tables" ON tabempresas;
DROP POLICY IF EXISTS "Admin users can view all reference tables" ON tabgrpar;

-- Create new policies using the header-based authentication
CREATE POLICY "Admin users can view all cadben"
ON cadben FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert cadben"
ON cadben FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can update cadben"
ON cadben FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can delete cadben"
ON cadben FOR DELETE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all caddep"
ON caddep FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert caddep"
ON caddep FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can update caddep"
ON caddep FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can delete caddep"
ON caddep FOR DELETE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all mgumrr"
ON mgumrr FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert mgumrr"
ON mgumrr FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can update mgumrr"
ON mgumrr FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can delete mgumrr"
ON mgumrr FOR DELETE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all mgumrrapg"
ON mgumrrapg FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert mgumrrapg"
ON mgumrrapg FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can update mgumrrapg"
ON mgumrrapg FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can delete mgumrrapg"
ON mgumrrapg FOR DELETE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all irpfd"
ON irpfd FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all irpft"
ON irpft FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view irpfdb"
ON irpfdb FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view irpftb"
ON irpftb FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admins can manage noticias"
ON noticias FOR ALL
USING (public.is_authenticated_admin())
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admins can manage sobre_funsep"
ON sobre_funsep FOR ALL
USING (public.is_authenticated_admin())
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all tokens"
ON relatorio_tokens FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert tokens"
ON relatorio_tokens FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all requerimentos"
ON requerimentos FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can update requerimentos"
ON requerimentos FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can manage all senhas"
ON senhas FOR ALL
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can insert usuarios"
ON usuarios FOR INSERT
WITH CHECK (public.is_authenticated_admin());

CREATE POLICY "Admin users can update usuarios"
ON usuarios FOR UPDATE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can delete usuarios"
ON usuarios FOR DELETE
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all reference tables tabbeneficios"
ON tabbeneficios FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all reference tables tabempresas"
ON tabempresas FOR SELECT
USING (public.is_authenticated_admin());

CREATE POLICY "Admin users can view all reference tables tabgrpar"
ON tabgrpar FOR SELECT
USING (public.is_authenticated_admin());