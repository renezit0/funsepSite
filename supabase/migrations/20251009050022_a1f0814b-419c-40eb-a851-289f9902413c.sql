-- Create requerimentos table
CREATE TABLE public.requerimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  matricula bigint NOT NULL,
  nome_solicitante text NOT NULL,
  email text NOT NULL,
  telefone text,
  dados jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDENTE',
  observacoes_admin text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  respondido_por_sigla text,
  respondido_em timestamp with time zone,
  CONSTRAINT valid_tipo CHECK (tipo IN (
    'exclusao_associado',
    'exclusao_dependente',
    'inclusao_associado',
    'inclusao_dependente',
    'inclusao_recem_nascido',
    'inscricao_pensionista',
    'requerimento_21_anos',
    'requerimento_diversos',
    'requerimento_auxilio_saude',
    'requerimento_reembolso',
    'termo_ciencia',
    'termo_compromisso',
    'termo_opcao'
  )),
  CONSTRAINT valid_status CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'NEGADO', 'CANCELADO'))
);

-- Enable RLS
ALTER TABLE public.requerimentos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requerimentos
CREATE POLICY "Users can view their own requerimentos"
ON public.requerimentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.senhas 
    WHERE senhas.matricula = requerimentos.matricula
  )
);

-- Policy: Users can insert their own requerimentos
CREATE POLICY "Users can insert their own requerimentos"
ON public.requerimentos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.senhas 
    WHERE senhas.matricula = requerimentos.matricula
  )
);

-- Policy: Admin users can view all requerimentos
CREATE POLICY "Admin users can view all requerimentos"
ON public.requerimentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Policy: Admin users can update requerimentos
CREATE POLICY "Admin users can update requerimentos"
ON public.requerimentos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_requerimentos_updated_at
BEFORE UPDATE ON public.requerimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();