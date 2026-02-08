-- Add status column to usuarios table to allow inactive users
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS status text DEFAULT 'ATIVO';

-- Update RLS policies to include ANALISTA DE SISTEMAS
DROP POLICY IF EXISTS "Admin users can delete cadben" ON public.cadben;
DROP POLICY IF EXISTS "Admin users can insert cadben" ON public.cadben;
DROP POLICY IF EXISTS "Admin users can update cadben" ON public.cadben;

DROP POLICY IF EXISTS "Admin users can delete caddep" ON public.caddep;
DROP POLICY IF EXISTS "Admin users can insert caddep" ON public.caddep;
DROP POLICY IF EXISTS "Admin users can update caddep" ON public.caddep;

DROP POLICY IF EXISTS "Admin users can delete usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admin users can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Admin users can update usuarios" ON public.usuarios;

-- Create new policies for cadben (beneficiários)
CREATE POLICY "Admin users can delete cadben" ON public.cadben
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can insert cadben" ON public.cadben
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can update cadben" ON public.cadben
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Create new policies for caddep (dependentes)
CREATE POLICY "Admin users can delete caddep" ON public.caddep
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can insert caddep" ON public.caddep
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can update caddep" ON public.caddep
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Create new policies for usuarios (users)
CREATE POLICY "Admin users can delete usuarios" ON public.usuarios
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios usuarios_1 ON admin_sessions.sigla = usuarios_1.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios_1.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can insert usuarios" ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios usuarios_1 ON admin_sessions.sigla = usuarios_1.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios_1.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admin users can update usuarios" ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    JOIN usuarios u ON admin_sessions.sigla = u.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND u.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);