-- Criar tabela para armazenar tokens de redefinição de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  cpf_or_email VARCHAR(255) NOT NULL,
  matricula INTEGER REFERENCES cadben(matricula),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  created_by_sigla VARCHAR(50), -- Se foi criado por admin
  request_ip VARCHAR(50)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_matricula ON password_reset_tokens(matricula);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Armazena tokens únicos para redefinição de senha';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único gerado aleatoriamente';
COMMENT ON COLUMN password_reset_tokens.cpf_or_email IS 'CPF ou email usado para solicitar a redefinição';
COMMENT ON COLUMN password_reset_tokens.matricula IS 'Matrícula do beneficiário associado';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica se o token já foi utilizado';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data e hora de expiração do token (24 horas após criação)';
COMMENT ON COLUMN password_reset_tokens.created_by_sigla IS 'Sigla do administrador que criou (se aplicável)';

-- Função para limpar tokens expirados automaticamente (pode ser executada via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW()
    OR (used = TRUE AND used_at < NOW() - INTERVAL '7 days');
END;
$$;

COMMENT ON FUNCTION cleanup_expired_password_reset_tokens IS 'Remove tokens expirados ou usados há mais de 7 dias';
