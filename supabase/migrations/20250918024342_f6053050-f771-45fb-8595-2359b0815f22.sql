-- Add CPF column to usuarios table
ALTER TABLE public.usuarios ADD COLUMN cpf TEXT;

-- Create senhas table for associate passwords
CREATE TABLE public.senhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  matricula BIGINT,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_sigla TEXT,
  CONSTRAINT fk_senhas_matricula FOREIGN KEY (matricula) REFERENCES public.cadben(matricula)
);

-- Enable RLS for senhas table
ALTER TABLE public.senhas ENABLE ROW LEVEL SECURITY;

-- Create policies for senhas table
CREATE POLICY "Admin users can manage all senhas" 
ON public.senhas 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM (admin_sessions
    JOIN usuarios ON (admin_sessions.sigla = usuarios.sigla))
  WHERE (admin_sessions.is_active = true) 
    AND (admin_sessions.expires_at > now()) 
    AND (usuarios.cargo = ANY (ARRAY['GERENTE'::text, 'DESENVOLVEDOR'::text, 'ANALISTA DE SISTEMAS'::text]))
));

-- Allow public read for authentication purposes
CREATE POLICY "Allow read for login authentication" 
ON public.senhas 
FOR SELECT 
USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_senhas_updated_at
BEFORE UPDATE ON public.senhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();