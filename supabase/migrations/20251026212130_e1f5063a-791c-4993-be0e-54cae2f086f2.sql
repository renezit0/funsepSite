-- Corrigir search_path das funções para segurança

-- Função update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar triggers que usam essa função
CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON noticias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_senhas_updated_at
  BEFORE UPDATE ON senhas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requerimentos_updated_at
  BEFORE UPDATE ON requerimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função update_sobre_funsep_updated_at
DROP FUNCTION IF EXISTS public.update_sobre_funsep_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_sobre_funsep_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER update_sobre_funsep_updated_at
  BEFORE UPDATE ON sobre_funsep
  FOR EACH ROW
  EXECUTE FUNCTION update_sobre_funsep_updated_at();

-- Adicionar políticas básicas para tabelas de backup (irpfdb, irpftb) se não existirem
-- Estas tabelas são backups e só admins devem acessar
CREATE POLICY "Admin users can view irpfdb" ON irpfdb
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

CREATE POLICY "Admin users can view irpftb" ON irpftb
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);