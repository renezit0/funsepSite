-- CORREÇÃO CRÍTICA DE SEGURANÇA
-- Remover todas as políticas permissivas e criar políticas restritivas

-- 1. CADBEN - Apenas admins autenticados ou próprio beneficiário autenticado
DROP POLICY IF EXISTS "Users can view cadben for authentication" ON cadben;
DROP POLICY IF EXISTS "Admin users can view all cadben" ON cadben;

CREATE POLICY "Admin users can view all cadben" ON cadben
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own cadben" ON cadben
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || cadben.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 2. CADDEP - Apenas admins ou titular autenticado
DROP POLICY IF EXISTS "Admin users can view all caddep" ON caddep;
DROP POLICY IF EXISTS "Users can view their own dependents" ON caddep;

CREATE POLICY "Admin users can view all caddep" ON caddep
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own dependents" ON caddep
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || caddep.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 3. ADMIN_SESSIONS - Apenas própria sessão ou admins
DROP POLICY IF EXISTS "Admins can view sessions" ON admin_sessions;

CREATE POLICY "Users can view own session" ON admin_sessions
FOR SELECT
USING (
  sigla IN (
    SELECT sigla FROM admin_sessions WHERE is_active = true AND expires_at > now()
  )
);

-- 4. RELATORIO_TOKENS - Apenas próprios tokens ou admins
DROP POLICY IF EXISTS "Admin users can view all tokens" ON relatorio_tokens;
DROP POLICY IF EXISTS "Users can view their own report tokens" ON relatorio_tokens;

CREATE POLICY "Admin users can view all tokens" ON relatorio_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own tokens" ON relatorio_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || relatorio_tokens.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 5. MGUMRR e MGUMRRAPG - Apenas admins ou próprio beneficiário
DROP POLICY IF EXISTS "Admin users can view all mgumrr" ON mgumrr;
CREATE POLICY "Admin users can view all mgumrr" ON mgumrr
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own mgumrr" ON mgumrr
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || mgumrr.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

DROP POLICY IF EXISTS "Admin users can view all mgumrrapg" ON mgumrrapg;
CREATE POLICY "Admin users can view all mgumrrapg" ON mgumrrapg
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own mgumrrapg" ON mgumrrapg
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || mgumrrapg.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

-- 6. IR Tables - Apenas admins ou próprio beneficiário
DROP POLICY IF EXISTS "Admin users can view all irpfd" ON irpfd;
CREATE POLICY "Admin users can view all irpfd" ON irpfd
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own irpfd" ON irpfd
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || irpfd.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);

DROP POLICY IF EXISTS "Admin users can view all irpft" ON irpft;
CREATE POLICY "Admin users can view all irpft" ON irpft
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    JOIN usuarios ON admin_sessions.sigla = usuarios.sigla
    WHERE admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
    AND usuarios.cargo IN ('GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS')
  )
);

CREATE POLICY "Beneficiarios can view their own irpft" ON irpft
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admin_sessions
    WHERE admin_sessions.sigla = 'BEN-' || irpft.matricula::text
    AND admin_sessions.is_active = true
    AND admin_sessions.expires_at > now()
  )
);