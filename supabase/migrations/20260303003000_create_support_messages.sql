-- Mensagens de suporte enviadas por associados (login/contato)
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(255) NOT NULL,
  matricula bigint NULL,
  matricula_desconhecida boolean NOT NULL DEFAULT false,
  email varchar(255) NOT NULL,
  cpf varchar(11) NOT NULL,
  data_nascimento date NOT NULL,
  telefone varchar(20) NOT NULL,
  mensagem text NOT NULL,
  origem varchar(30) NOT NULL DEFAULT 'LOGIN_MODAL',
  status varchar(20) NOT NULL DEFAULT 'PENDENTE',
  feedback_interno text NULL,
  respondido_por_sigla varchar(50) NULL,
  respondido_por_cargo varchar(100) NULL,
  respondido_em timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_messages_cpf_digits CHECK (cpf ~ '^\\d{11}$'),
  CONSTRAINT support_messages_origem_check CHECK (origem IN ('LOGIN_MODAL', 'CONTACT_PAGE')),
  CONSTRAINT support_messages_status_check CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'RESPONDIDO'))
);

CREATE INDEX IF NOT EXISTS support_messages_created_at_idx ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_status_idx ON public.support_messages (status);
CREATE INDEX IF NOT EXISTS support_messages_matricula_idx ON public.support_messages (matricula);
CREATE INDEX IF NOT EXISTS support_messages_cpf_idx ON public.support_messages (cpf);

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.support_messages IS 'Mensagens enviadas por associados para suporte de acesso';
COMMENT ON COLUMN public.support_messages.origem IS 'Origem da mensagem: LOGIN_MODAL ou CONTACT_PAGE';
COMMENT ON COLUMN public.support_messages.feedback_interno IS 'Anotações internas da equipe de atendimento/tecnologia';

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert support messages" ON public.support_messages;
CREATE POLICY "Allow insert support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin roles can read support messages" ON public.support_messages;
CREATE POLICY "Admin roles can read support messages"
ON public.support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_sessions s
    JOIN public.usuarios u ON u.sigla = s.sigla
    WHERE s.is_active = true
      AND s.expires_at > now()
      AND u.cargo IN ('GERENTE', 'ANALISTA DE SISTEMAS', 'DESENVOLVEDOR')
  )
);

DROP POLICY IF EXISTS "Admin roles can update support messages" ON public.support_messages;
CREATE POLICY "Admin roles can update support messages"
ON public.support_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_sessions s
    JOIN public.usuarios u ON u.sigla = s.sigla
    WHERE s.is_active = true
      AND s.expires_at > now()
      AND u.cargo IN ('GERENTE', 'ANALISTA DE SISTEMAS', 'DESENVOLVEDOR')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_sessions s
    JOIN public.usuarios u ON u.sigla = s.sigla
    WHERE s.is_active = true
      AND s.expires_at > now()
      AND u.cargo IN ('GERENTE', 'ANALISTA DE SISTEMAS', 'DESENVOLVEDOR')
  )
);
