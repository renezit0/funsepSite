-- BLOQUEAR ACESSO PÚBLICO FINAL às tabelas sensíveis
DROP POLICY IF EXISTS "Allow authentication check" ON senhas;
DROP POLICY IF EXISTS "Allow read for login" ON usuarios;

-- Senhas: NENHUM acesso público (login via edge function)
CREATE POLICY "Deny all public access to senhas" ON senhas
FOR SELECT
USING (false);

-- Usuarios: NENHUM acesso público (login via edge function)  
CREATE POLICY "Deny all public access to usuarios" ON usuarios
FOR SELECT
USING (false);