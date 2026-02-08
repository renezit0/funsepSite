-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de notícias
CREATE TABLE public.noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  imagem_url TEXT,
  publicado BOOLEAN NOT NULL DEFAULT false,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  autor_sigla TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública de notícias publicadas
CREATE POLICY "Notícias publicadas são visíveis para todos" 
ON public.noticias 
FOR SELECT 
USING (publicado = true);

-- Política para admins gerenciarem notícias
CREATE POLICY "Admins podem gerenciar todas as notícias" 
ON public.noticias 
FOR ALL 
USING (EXISTS (
  SELECT 1 
  FROM admin_sessions 
  JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
  WHERE admin_sessions.is_active = true 
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
));

-- Criar bucket para imagens das notícias
INSERT INTO storage.buckets (id, name, public) 
VALUES ('noticias', 'noticias', true);

-- Políticas para o bucket de notícias
CREATE POLICY "Imagens de notícias são publicamente acessíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'noticias');

CREATE POLICY "Admins podem fazer upload de imagens de notícias" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'noticias' 
  AND EXISTS (
    SELECT 1 
    FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admins podem atualizar imagens de notícias" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'noticias' 
  AND EXISTS (
    SELECT 1 
    FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Admins podem deletar imagens de notícias" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'noticias' 
  AND EXISTS (
    SELECT 1 
    FROM admin_sessions 
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true 
      AND admin_sessions.expires_at > now()
      AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_noticias_updated_at
BEFORE UPDATE ON public.noticias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();