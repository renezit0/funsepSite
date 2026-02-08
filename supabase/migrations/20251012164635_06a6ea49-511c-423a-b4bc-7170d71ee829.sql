-- Criar bucket para documentos de requerimentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('requerimentos', 'requerimentos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket requerimentos
CREATE POLICY "Usuários podem fazer upload de seus documentos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'requerimentos'
);

CREATE POLICY "Admins podem ver todos os documentos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'requerimentos' AND
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admins podem deletar documentos"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'requerimentos' AND
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Adicionar coluna para armazenar URLs dos documentos
ALTER TABLE requerimentos 
ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]'::jsonb;