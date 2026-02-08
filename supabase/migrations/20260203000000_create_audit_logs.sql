-- Create audit logs table for analytics
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  page text NULL,
  label text NULL,
  element text NULL,
  target text NULL,
  path text NULL,
  user_agent text NULL,
  platform text NULL,
  url text NULL,
  referrer text NULL,
  app_area text NULL,
  user_sigla text NULL,
  user_matricula bigint NULL,
  user_nome text NULL,
  user_cargo text NULL,
  is_admin boolean NULL,
  extra jsonb NULL
);

COMMENT ON TABLE public.audit_logs IS 'Registro de auditoria de eventos do frontend (cliques, abas e user agent).';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Tipo de evento (click, tab_view, etc)';
COMMENT ON COLUMN public.audit_logs.app_area IS 'Área do sistema (public/admin)';

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON public.audit_logs (event_type);
CREATE INDEX IF NOT EXISTS audit_logs_app_area_idx ON public.audit_logs (app_area);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert audit logs
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- Allow only DESENVOLVEDOR to read audit logs
DROP POLICY IF EXISTS "Developer can read audit logs" ON public.audit_logs;
CREATE POLICY "Developer can read audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo = 'DESENVOLVEDOR'
  )
);
