-- Enable RLS on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadben ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caddep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mgumrrapg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabbeneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabempresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabgrpar ENABLE ROW LEVEL SECURITY;

-- Create admin sessions table to track admin logins
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin users can view all usuarios" 
ON public.usuarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.sigla = usuarios.sigla 
    AND admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all cadben" 
ON public.cadben 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can update cadben" 
ON public.cadben 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all caddep" 
ON public.caddep 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can update caddep" 
ON public.caddep 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all mgumrrapg" 
ON public.mgumrrapg 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all reference tables" 
ON public.tabbeneficios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all reference tables" 
ON public.tabempresas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

CREATE POLICY "Admin users can view all reference tables" 
ON public.tabgrpar 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions 
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > NOW()
  )
);

-- Allow admins to manage their own sessions
CREATE POLICY "Admins can manage their sessions" 
ON public.admin_sessions 
FOR ALL 
USING (true);