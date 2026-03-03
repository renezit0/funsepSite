-- Criar tabela para logs de alterações de email
-- Não usa FK para cadben porque a tabela é atualizada frequentemente
CREATE TABLE IF NOT EXISTS email_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula INTEGER NOT NULL,
  cpf VARCHAR(11),
  nome_associado VARCHAR(255),
  email_anterior VARCHAR(255),
  email_novo VARCHAR(255) NOT NULL,
  alterado_por_sigla VARCHAR(50) NOT NULL,
  alterado_por_nome VARCHAR(255),
  motivo VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_email_change_logs_matricula ON email_change_logs(matricula);
CREATE INDEX IF NOT EXISTS idx_email_change_logs_cpf ON email_change_logs(cpf);
CREATE INDEX IF NOT EXISTS idx_email_change_logs_created_at ON email_change_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_change_logs_alterado_por ON email_change_logs(alterado_por_sigla);

-- Comentários
COMMENT ON TABLE email_change_logs IS 'Registro de auditoria de alterações de email dos associados';
COMMENT ON COLUMN email_change_logs.matricula IS 'Matrícula do associado (sem FK pois cadben é atualizado frequentemente)';
COMMENT ON COLUMN email_change_logs.cpf IS 'CPF do associado no momento da alteração';
COMMENT ON COLUMN email_change_logs.nome_associado IS 'Nome do associado no momento da alteração';
COMMENT ON COLUMN email_change_logs.email_anterior IS 'Email anterior (null se for primeiro cadastro)';
COMMENT ON COLUMN email_change_logs.email_novo IS 'Novo email cadastrado';
COMMENT ON COLUMN email_change_logs.alterado_por_sigla IS 'Sigla do usuário que fez a alteração';
COMMENT ON COLUMN email_change_logs.alterado_por_nome IS 'Nome do usuário que fez a alteração';
COMMENT ON COLUMN email_change_logs.motivo IS 'Motivo da alteração (opcional)';

-- Função para limpar logs antigos (opcional, executar via cron job)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Manter logs dos últimos 2 anos
  DELETE FROM email_change_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$;

COMMENT ON FUNCTION cleanup_old_email_logs IS 'Remove logs de email com mais de 2 anos';
