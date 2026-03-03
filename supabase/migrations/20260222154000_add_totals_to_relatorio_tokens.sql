ALTER TABLE public.relatorio_tokens
ADD COLUMN IF NOT EXISTS valor_total_centavos bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS detalhes_relatorio jsonb NOT NULL DEFAULT '{}'::jsonb;
