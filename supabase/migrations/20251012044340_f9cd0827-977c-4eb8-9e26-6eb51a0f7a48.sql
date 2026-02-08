-- Criar função security definer para verificar permissões de admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_sigla text)
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

-- Remover política antiga de UPDATE
DROP POLICY IF EXISTS "Admin users can update usuarios" ON usuarios;

-- Criar nova política usando a função security definer
CREATE POLICY "Admin users can update usuarios" 
ON usuarios 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND public.is_admin_user(admin_sessions.sigla)
  )
);

-- Fazer o mesmo para DELETE
DROP POLICY IF EXISTS "Admin users can delete usuarios" ON usuarios;

CREATE POLICY "Admin users can delete usuarios" 
ON usuarios 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND public.is_admin_user(admin_sessions.sigla)
  )
);

-- Fazer o mesmo para INSERT
DROP POLICY IF EXISTS "Admin users can insert usuarios" ON usuarios;

CREATE POLICY "Admin users can insert usuarios" 
ON usuarios 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND public.is_admin_user(admin_sessions.sigla)
  )
);