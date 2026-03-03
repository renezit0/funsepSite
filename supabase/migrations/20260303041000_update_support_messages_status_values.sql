-- Ajusta status de mensagens de suporte para usar ATENDIDO
UPDATE public.support_messages
SET status = 'ATENDIDO'
WHERE status = 'RESPONDIDO';

ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_status_check;

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_status_check
  CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'ATENDIDO'));
