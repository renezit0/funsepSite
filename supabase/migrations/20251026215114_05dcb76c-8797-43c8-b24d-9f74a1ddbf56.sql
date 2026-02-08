-- Limpar e recriar políticas de admin_sessions sem recursão

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Allow public read of sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow insert for authentication" ON admin_sessions;
DROP POLICY IF EXISTS "Allow update for logout" ON admin_sessions;
DROP POLICY IF EXISTS "Deny public delete" ON admin_sessions;
DROP POLICY IF EXISTS "Users can view own active session" ON admin_sessions;
DROP POLICY IF EXISTS "Admins can delete any session" ON admin_sessions;

-- Reabilitar RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples que NÃO consultam admin_sessions
CREATE POLICY "public_read_sessions" ON admin_sessions
FOR SELECT
USING (true);

CREATE POLICY "public_insert_sessions" ON admin_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "public_update_logout" ON admin_sessions
FOR UPDATE
USING (true)
WITH CHECK (is_active = false OR is_active = true);

-- Delete: apenas service role (via edge function)