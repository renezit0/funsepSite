-- Remove ALL old policies from cadben and caddep
DROP POLICY IF EXISTS "Admin users can view all cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can insert cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can update cadben" ON cadben;
DROP POLICY IF EXISTS "Admin users can delete cadben" ON cadben;
DROP POLICY IF EXISTS "Beneficiarios can view their own cadben" ON cadben;
DROP POLICY IF EXISTS "Allow read access cadben" ON cadben;
DROP POLICY IF EXISTS "Allow all operations cadben" ON cadben;

DROP POLICY IF EXISTS "Admin users can view all caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can insert caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can update caddep" ON caddep;
DROP POLICY IF EXISTS "Admin users can delete caddep" ON caddep;
DROP POLICY IF EXISTS "Beneficiarios can view their own dependents" ON caddep;
DROP POLICY IF EXISTS "Allow read access caddep" ON caddep;
DROP POLICY IF EXISTS "Allow all operations caddep" ON caddep;

-- Create simple, permissive policies
CREATE POLICY "Full access cadben"
ON cadben FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Full access caddep"
ON caddep FOR ALL
USING (true)
WITH CHECK (true);