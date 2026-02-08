-- Remover a política restritiva atual para usuarios
DROP POLICY IF EXISTS "Admin users can view all usuarios" ON public.usuarios;

-- Criar uma política que permite acesso de leitura para login
CREATE POLICY "Allow read for login" 
ON public.usuarios 
FOR SELECT 
USING (true);

-- Permitir inserção e leitura na tabela admin_sessions para todos durante o login
DROP POLICY IF EXISTS "Admins can manage their sessions" ON public.admin_sessions;

CREATE POLICY "Allow session management" 
ON public.admin_sessions 
FOR ALL 
USING (true);