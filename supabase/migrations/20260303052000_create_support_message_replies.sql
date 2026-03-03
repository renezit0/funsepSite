CREATE TABLE IF NOT EXISTS public.support_message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE,
  sender_tipo varchar(20) NOT NULL,
  sender_nome varchar(255) NULL,
  sender_sigla varchar(50) NULL,
  mensagem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_message_replies_sender_tipo_check CHECK (sender_tipo IN ('ASSOCIADO', 'EQUIPE'))
);

CREATE INDEX IF NOT EXISTS support_message_replies_message_id_idx ON public.support_message_replies (support_message_id);
CREATE INDEX IF NOT EXISTS support_message_replies_created_at_idx ON public.support_message_replies (created_at);

COMMENT ON TABLE public.support_message_replies IS 'Respostas em thread das ocorrências de suporte';
