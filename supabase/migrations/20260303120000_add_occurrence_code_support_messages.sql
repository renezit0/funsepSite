-- Identificador único humanizado para ocorrências de suporte
-- Formato:
-- A######### -> Associados
-- I######### -> Internas
-- E######### -> Externas

ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS occurrence_code varchar(10);

CREATE OR REPLACE FUNCTION public.support_message_prefix(origem text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF origem IN ('ASSOCIADO_PORTAL', 'ADMIN_ASSOCIADO') THEN
    RETURN 'A';
  ELSIF origem = 'ADMIN_INTERNO' THEN
    RETURN 'I';
  ELSE
    RETURN 'E';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_support_occurrence_code(origem text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  prefix text;
  candidate text;
  exists_code boolean;
  attempt int := 0;
BEGIN
  prefix := public.support_message_prefix(origem);

  LOOP
    attempt := attempt + 1;
    IF attempt > 1000 THEN
      RAISE EXCEPTION 'Não foi possível gerar occurrence_code único após % tentativas', attempt;
    END IF;

    candidate := prefix || lpad((floor(random() * 1000000000))::bigint::text, 9, '0');

    SELECT EXISTS (
      SELECT 1
      FROM public.support_messages sm
      WHERE sm.occurrence_code = candidate
    ) INTO exists_code;

    IF NOT exists_code THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_message_occurrence_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  required_prefix text;
BEGIN
  required_prefix := public.support_message_prefix(NEW.origem);

  IF NEW.occurrence_code IS NULL
     OR NEW.occurrence_code = ''
     OR left(NEW.occurrence_code, 1) <> required_prefix THEN
    NEW.occurrence_code := public.generate_support_occurrence_code(NEW.origem);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_support_message_occurrence_code_trigger ON public.support_messages;
CREATE TRIGGER set_support_message_occurrence_code_trigger
  BEFORE INSERT OR UPDATE OF origem, occurrence_code
  ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_support_message_occurrence_code();

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT id, origem
    FROM public.support_messages
    WHERE occurrence_code IS NULL OR occurrence_code = ''
    ORDER BY created_at, id
  LOOP
    UPDATE public.support_messages
    SET occurrence_code = public.generate_support_occurrence_code(item.origem)
    WHERE id = item.id;
  END LOOP;
END;
$$;

ALTER TABLE public.support_messages
  ALTER COLUMN occurrence_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS support_messages_occurrence_code_uk
  ON public.support_messages (occurrence_code);

COMMENT ON COLUMN public.support_messages.occurrence_code IS
  'Código único da ocorrência: A######### (associado), I######### (interna), E######### (externa)';
