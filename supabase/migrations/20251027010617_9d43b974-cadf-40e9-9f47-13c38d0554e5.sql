-- Remove ALL policies from usuarios and senhas tables
DROP POLICY IF EXISTS "Deny all public access to usuarios" ON usuarios;
DROP POLICY IF EXISTS "Deny all public access to senhas" ON senhas;
DROP POLICY IF EXISTS "Admin users can delete usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin users can insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin users can update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin users can manage all senhas" ON senhas;

-- Create simple policies that allow all operations
CREATE POLICY "Allow all operations usuarios"
ON usuarios FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations senhas"
ON senhas FOR ALL
USING (true)
WITH CHECK (true);