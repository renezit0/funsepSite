-- Habilitar pgcrypto para hashing de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Função para hashear senha apenas quando necessário
CREATE OR REPLACE FUNCTION public.hash_password_if_needed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.senha IS NULL OR NEW.senha = '' THEN
    RETURN NEW;
  END IF;

  -- Se já parece hash bcrypt, não re-hashear
  IF NEW.senha ~ '^\$2[aby]\$' THEN
    RETURN NEW;
  END IF;

  NEW.senha := extensions.crypt(NEW.senha, extensions.gen_salt('bf', 12));
  RETURN NEW;
END;
$$;

-- Função para validar senha contra hash
CREATE OR REPLACE FUNCTION public.verify_password(plain text, hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT extensions.crypt(plain, hash) = hash;
$$;

-- Trigger para usuarios
DROP TRIGGER IF EXISTS trg_hash_password_usuarios ON public.usuarios;
CREATE TRIGGER trg_hash_password_usuarios
BEFORE INSERT OR UPDATE OF senha ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.hash_password_if_needed();

-- Trigger para senhas (beneficiários)
DROP TRIGGER IF EXISTS trg_hash_password_senhas ON public.senhas;
CREATE TRIGGER trg_hash_password_senhas
BEFORE INSERT OR UPDATE OF senha ON public.senhas
FOR EACH ROW
EXECUTE FUNCTION public.hash_password_if_needed();
