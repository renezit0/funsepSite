ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_origem_check;

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_origem_check
  CHECK (origem IN ('LOGIN_MODAL', 'CONTACT_PAGE', 'ASSOCIADO_PORTAL'));

COMMENT ON COLUMN public.support_messages.origem IS 'Origem da mensagem: LOGIN_MODAL, CONTACT_PAGE ou ASSOCIADO_PORTAL';
