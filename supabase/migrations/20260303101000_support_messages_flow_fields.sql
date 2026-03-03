ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS awaiting_party varchar(30) NULL,
  ADD COLUMN IF NOT EXISTS last_sender_tipo varchar(20) NULL,
  ADD COLUMN IF NOT EXISTS last_sender_sigla varchar(50) NULL,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz NULL;

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_awaiting_party_check
  CHECK (awaiting_party IN ('EQUIPE', 'ASSOCIADO', 'REMETENTE_INTERNO', 'DESTINATARIO_INTERNO', 'NENHUM'));

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_last_sender_tipo_check
  CHECK (last_sender_tipo IN ('ASSOCIADO', 'EQUIPE', 'SISTEMA'));

UPDATE public.support_messages
SET
  awaiting_party = CASE
    WHEN status IN ('ATENDIDO', 'RESPONDIDO') THEN 'NENHUM'
    WHEN origem = 'ADMIN_INTERNO' THEN 'DESTINATARIO_INTERNO'
    WHEN origem = 'ADMIN_ASSOCIADO' THEN 'ASSOCIADO'
    ELSE 'EQUIPE'
  END,
  last_sender_tipo = CASE
    WHEN origem IN ('ASSOCIADO_PORTAL', 'LOGIN_MODAL', 'CONTACT_PAGE') THEN 'ASSOCIADO'
    WHEN origem IN ('ADMIN_INTERNO', 'ADMIN_ASSOCIADO') THEN 'EQUIPE'
    ELSE 'SISTEMA'
  END,
  last_sender_sigla = COALESCE(last_sender_sigla, created_by_sigla),
  last_interaction_at = COALESCE(last_interaction_at, updated_at, created_at)
WHERE awaiting_party IS NULL OR last_sender_tipo IS NULL OR last_interaction_at IS NULL;

CREATE INDEX IF NOT EXISTS support_messages_awaiting_party_idx ON public.support_messages (awaiting_party);
CREATE INDEX IF NOT EXISTS support_messages_last_interaction_at_idx ON public.support_messages (last_interaction_at DESC);

COMMENT ON COLUMN public.support_messages.awaiting_party IS 'Indica quem deve agir: EQUIPE, ASSOCIADO, REMETENTE_INTERNO, DESTINATARIO_INTERNO ou NENHUM';
COMMENT ON COLUMN public.support_messages.last_sender_tipo IS 'Último tipo de remetente na conversa (ASSOCIADO, EQUIPE ou SISTEMA)';
COMMENT ON COLUMN public.support_messages.last_sender_sigla IS 'Sigla do último remetente da equipe, quando aplicável';
COMMENT ON COLUMN public.support_messages.last_interaction_at IS 'Data/hora da última interação relevante da ocorrência';
