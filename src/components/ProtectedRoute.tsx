import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminAuth } from "@/services/adminAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedCargos?: string[];
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  allowedCargos = []
}: ProtectedRouteProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [validatedSession, setValidatedSession] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    validateAccess();
  }, [session]);

  const validateAccess = async () => {
    setIsValidating(true);

    if (!session) {
      setIsValidating(false);
      return;
    }

    try {
      // Validar sessão e obter dados reais do servidor
      const refreshedSession = await adminAuth.refreshSession();

      if (!refreshedSession) {
        setValidatedSession(null);
        setIsValidating(false);
        return;
      }

      setValidatedSession(refreshedSession);
    } catch (error) {
      console.error('Erro ao validar acesso:', error);
      setValidatedSession(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Loading state
  if (authLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não autenticado
  if (!validatedSession) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Verificar se precisa ser admin
  if (requireAdmin) {
    const isAdmin = validatedSession.user.cargo !== 'ASSOCIADO';

    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }

    // Verificar cargos específicos permitidos
    if (allowedCargos.length > 0) {
      const hasAllowedCargo = allowedCargos.includes(validatedSession.user.cargo);

      if (!hasAllowedCargo) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return <>{children}</>;
}
