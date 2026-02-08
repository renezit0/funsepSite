-- Enable RLS on mgumrr table
ALTER TABLE public.mgumrr ENABLE ROW LEVEL SECURITY;

-- Admin users can view all mgumrr
CREATE POLICY "Admin users can view all mgumrr"
ON public.mgumrr
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
  )
);

-- Admin users can manage mgumrr
CREATE POLICY "Admin users can insert mgumrr"
ON public.mgumrr
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

CREATE POLICY "Admin users can update mgumrr"
ON public.mgumrr
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

CREATE POLICY "Admin users can delete mgumrr"
ON public.mgumrr
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

-- Enable RLS on mgumrrapg table
ALTER TABLE public.mgumrrapg ENABLE ROW LEVEL SECURITY;

-- Admin users can view all mgumrrapg
CREATE POLICY "Admin users can view all mgumrrapg"
ON public.mgumrrapg
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
  )
);

-- Admin users can manage mgumrrapg
CREATE POLICY "Admin users can insert mgumrrapg"
ON public.mgumrrapg
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

CREATE POLICY "Admin users can update mgumrrapg"
ON public.mgumrrapg
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

CREATE POLICY "Admin users can delete mgumrrapg"
ON public.mgumrrapg
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