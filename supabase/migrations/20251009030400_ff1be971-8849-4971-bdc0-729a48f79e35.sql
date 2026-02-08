-- Allow reading cadben during beneficiary authentication
-- This policy allows SELECT when there's a matching record in senhas table
CREATE POLICY "Allow cadben read for authentication"
ON public.cadben
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.senhas 
    WHERE senhas.matricula = cadben.matricula
  )
);