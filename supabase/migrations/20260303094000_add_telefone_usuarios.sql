ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefone varchar(20) NULL;

COMMENT ON COLUMN public.usuarios.telefone IS 'Telefone do colaborador para notificações internas (WhatsApp)';

CREATE INDEX IF NOT EXISTS usuarios_status_idx ON public.usuarios (status);
CREATE INDEX IF NOT EXISTS usuarios_cpf_idx ON public.usuarios (cpf);
CREATE INDEX IF NOT EXISTS usuarios_telefone_idx ON public.usuarios (telefone);
