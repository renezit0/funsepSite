import { useEffect, useMemo, useState } from "react";
import { LogIn, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminAuth } from "@/services/adminAuth";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminDashboard from "@/pages/AdminDashboard";

const adminRoles = ["GERENTE", "DESENVOLVEDOR", "ANALISTA DE SISTEMAS"];

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return value;
};

export function DesktopAdminEntry() {
  const { session, isLoading, login, logout } = useAuth();
  const { mostrarFeedback, mostrarToast } = useFeedback();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = useMemo(() => {
    return !!session?.user?.cargo && adminRoles.includes(session.user.cargo);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (isAdmin) return;

    logout().catch(() => {
      // noop
    });
  }, [isAdmin, logout, session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const result = await login(cleanCpf, password);
      if (!result.success) {
        mostrarFeedback("erro", "Erro no login", result.error || "CPF ou senha inválidos");
        return;
      }

      const current = adminAuth.getSession();
      if (!current?.user?.cargo || !adminRoles.includes(current.user.cargo)) {
        await logout();
        mostrarFeedback("erro", "Acesso negado", "Este aplicativo é exclusivo para usuários administrativos.");
        return;
      }

      setCpf("");
      setPassword("");
      mostrarToast("sucesso", "Login realizado com sucesso.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session && isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-secondary">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">FUNSEP Admin</CardTitle>
          <p className="text-sm text-muted-foreground text-center">Acesso exclusivo ao painel administrativo</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="desktop-admin-cpf">CPF *</Label>
              <Input
                id="desktop-admin-cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                maxLength={14}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desktop-admin-password">Senha *</Label>
              <Input
                id="desktop-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">Acesso exclusivo de colaboradores</span>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>

          <Card className="bg-bg-secondary">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-info" />
                Como acessar
              </p>
              <p className="text-muted-foreground">Use seu CPF e senha de colaborador com perfil administrativo.</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
