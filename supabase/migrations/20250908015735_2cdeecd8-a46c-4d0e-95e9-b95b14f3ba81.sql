-- Update RLS policies to allow GERENTE and DESENVOLVEDOR to edit records

-- Update cadben policies
DROP POLICY IF EXISTS "Admin users can update cadben" ON public.cadben;
CREATE POLICY "Admin users can update cadben" ON public.cadben
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add insert policy for cadben
CREATE POLICY "Admin users can insert cadben" ON public.cadben
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add delete policy for cadben
CREATE POLICY "Admin users can delete cadben" ON public.cadben
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Update caddep policies
DROP POLICY IF EXISTS "Admin users can update caddep" ON public.caddep;
CREATE POLICY "Admin users can update caddep" ON public.caddep
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add insert policy for caddep
CREATE POLICY "Admin users can insert caddep" ON public.caddep
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add delete policy for caddep
CREATE POLICY "Admin users can delete caddep" ON public.caddep
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add update policy for usuarios
CREATE POLICY "Admin users can update usuarios" ON public.usuarios
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios u ON admin_sessions.sigla = u.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND u.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add insert policy for usuarios
CREATE POLICY "Admin users can insert usuarios" ON public.usuarios
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);

-- Add delete policy for usuarios
CREATE POLICY "Admin users can delete usuarios" ON public.usuarios
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR')
  )
);