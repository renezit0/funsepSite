ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS created_by_sigla varchar(50) NULL,
  ADD COLUMN IF NOT EXISTS target_sigla varchar(50) NULL,
  ADD COLUMN IF NOT EXISTS target_matricula bigint NULL,
  ADD COLUMN IF NOT EXISTS target_type varchar(20) NOT NULL DEFAULT 'PUBLICO';

ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_origem_check;

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_origem_check
  CHECK (origem IN ('LOGIN_MODAL', 'CONTACT_PAGE', 'ASSOCIADO_PORTAL', 'ADMIN_INTERNO', 'ADMIN_ASSOCIADO'));

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_target_type_check
  CHECK (target_type IN ('PUBLICO', 'INTERNO', 'ASSOCIADO'));

CREATE INDEX IF NOT EXISTS support_messages_created_by_sigla_idx ON public.support_messages (created_by_sigla);
CREATE INDEX IF NOT EXISTS support_messages_target_sigla_idx ON public.support_messages (target_sigla);
CREATE INDEX IF NOT EXISTS support_messages_target_matricula_idx ON public.support_messages (target_matricula);
CREATE INDEX IF NOT EXISTS support_messages_target_type_idx ON public.support_messages (target_type);

COMMENT ON COLUMN public.support_messages.created_by_sigla IS 'Sigla de quem abriu a ocorrência no painel administrativo';
COMMENT ON COLUMN public.support_messages.target_sigla IS 'Sigla destinatária para ocorrências internas entre equipe';
COMMENT ON COLUMN public.support_messages.target_matricula IS 'Matrícula destinatária quando a ocorrência é direcionada ao associado';
COMMENT ON COLUMN public.support_messages.target_type IS 'Tipo do destinatário: PUBLICO, INTERNO, ASSOCIADO';
COMMENT ON COLUMN public.support_messages.origem IS 'Origem da mensagem: LOGIN_MODAL, CONTACT_PAGE, ASSOCIADO_PORTAL, ADMIN_INTERNO ou ADMIN_ASSOCIADO';
