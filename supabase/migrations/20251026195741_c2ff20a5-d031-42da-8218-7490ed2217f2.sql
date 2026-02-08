-- Criar tabela para armazenar tokens de relatórios
CREATE TABLE IF NOT EXISTS public.relatorio_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  matricula bigint NOT NULL,
  tipo_relatorio text NOT NULL CHECK (tipo_relatorio IN ('a_pagar', 'pagos', 'ir')),
  data_inicio text NOT NULL,
  data_fim text NOT NULL,
  gerado_por_matricula bigint,
  gerado_por_sigla text,
  gerado_em timestamp with time zone NOT NULL DEFAULT now(),
  html_content text NOT NULL,
  filename text NOT NULL,
  visualizacoes integer NOT NULL DEFAULT 0,
  ultima_visualizacao timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_relatorio_tokens_token ON public.relatorio_tokens(token);
CREATE INDEX idx_relatorio_tokens_matricula ON public.relatorio_tokens(matricula);
CREATE INDEX idx_relatorio_tokens_gerado_em ON public.relatorio_tokens(gerado_em DESC);

-- Enable RLS
ALTER TABLE public.relatorio_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin users podem ver todos os tokens
CREATE POLICY "Admin users can view all tokens"
ON public.relatorio_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.is_active = true
      AND admin_sessions.expires_at > now()
  )
);

-- Usuários podem ver tokens dos seus próprios relatórios
CREATE POLICY "Users can view their own report tokens"
ON public.relatorio_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM senhas
    WHERE senhas.matricula = relatorio_tokens.matricula
  )
);

-- Admin users podem inserir tokens
CREATE POLICY "Admin users can insert tokens"
ON public.relatorio_tokens
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

-- Qualquer um pode atualizar visualizações (para contabilizar)
CREATE POLICY "Anyone can update visualization count"
ON public.relatorio_tokens
FOR UPDATE
USING (true)
WITH CHECK (true);