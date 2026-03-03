import { useEffect, useMemo, useState } from "react";
import { LogIn, Info, Minus, Square, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminAuth } from "@/services/adminAuth";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { ForgotPasswordModal } from "@/components/modals/ForgotPasswordModal";
import { SupportMessageModal } from "@/components/modals/SupportMessageModal";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [windowMaximized, setWindowMaximized] = useState(false);

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

  useEffect(() => {
    const desktopApi = window.funsepDesktop;
    if (!desktopApi) return;

    desktopApi.getWindowState().then((state) => {
      setWindowMaximized(Boolean(state?.maximized));
    }).catch(() => {});

    const unsub = desktopApi.onWindowState((payload) => {
      setWindowMaximized(Boolean(payload?.maximized));
    });

    return () => unsub();
  }, []);

  const handleWindowControl = async (action: "minimize" | "toggle-maximize" | "close") => {
    const desktopApi = window.funsepDesktop;
    if (!desktopApi) return;
    try {
      await desktopApi.windowControl(action);
    } catch {
      // noop
    }
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-secondary pt-14">
      <div className="desktop-drag-region fixed top-0 left-0 right-0 z-40 h-9 border-b border-border/70 px-3 flex items-center justify-between bg-card/95">
        <div />
        <p className="text-xs text-muted-foreground">FUNSEP Admin</p>
        <div className="desktop-no-drag flex items-center gap-1.5">
          <button
            type="button"
            className="desktop-traffic-btn bg-[#febc2e]"
            onClick={() => handleWindowControl("minimize")}
            aria-label="Minimizar"
            title="Minimizar"
          >
            <Minus className="h-2.5 w-2.5 text-black/70" />
          </button>
          <button
            type="button"
            className="desktop-traffic-btn bg-[#28c840]"
            onClick={() => handleWindowControl("toggle-maximize")}
            aria-label={windowMaximized ? "Restaurar" : "Maximizar"}
            title={windowMaximized ? "Restaurar" : "Maximizar"}
          >
            <Square className="h-2 w-2 text-black/70" />
          </button>
          <button
            type="button"
            className="desktop-traffic-btn bg-[#ff5f57]"
            onClick={() => handleWindowControl("close")}
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="h-2.5 w-2.5 text-black/70" />
          </button>
        </div>
      </div>

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
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                Cadastrar ou recuperar senha
              </button>
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

          <Button type="button" variant="outline" className="w-full" onClick={() => setShowSupportMessage(true)}>
            Enviar mensagem
          </Button>
        </CardContent>
      </Card>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
      <SupportMessageModal
        isOpen={showSupportMessage}
        onClose={() => setShowSupportMessage(false)}
        source="LOGIN_MODAL"
      />
    </div>
  );
}
