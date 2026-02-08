-- Permitir acesso ao cadben para beneficiários durante autenticação
-- O problema é que precisamos ler cadben ANTES de criar a sessão

DROP POLICY IF EXISTS "Users can view their own cadben" ON cadben;

-- Permitir leitura se existe senha cadastrada para essa matrícula
CREATE POLICY "Users can view cadben for authentication" ON cadben
FOR SELECT
USING (
  -- Admin autenticado pode ver tudo
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
  OR
  -- Beneficiário pode ver próprios dados se tem senha cadastrada
  EXISTS (
    SELECT 1 FROM senhas
    WHERE senhas.matricula = cadben.matricula
  )
);