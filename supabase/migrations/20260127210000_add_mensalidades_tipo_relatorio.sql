-- Adicionar 'mensalidades' como tipo de relatório válido
ALTER TABLE public.relatorio_tokens
DROP CONSTRAINT IF EXISTS relatorio_tokens_tipo_relatorio_check;

ALTER TABLE public.relatorio_tokens
ADD CONSTRAINT relatorio_tokens_tipo_relatorio_check
CHECK (tipo_relatorio IN ('a_pagar', 'pagos', 'ir', 'mensalidades'));
