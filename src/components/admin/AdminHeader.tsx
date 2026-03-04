import React, { useEffect, useState } from "react";
import { Bell, RefreshCw, LogOut, User, Home, Minus, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSession } from "@/services/adminAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";

interface AdminHeaderProps {
  session: AdminSession;
  onLogout: () => void;
  onOpenSupportMessages?: () => void;
}

const rolesWithSupportAccess = ["GERENTE", "ANALISTA DE SISTEMAS", "DESENVOLVEDOR"];

export function AdminHeader({ session, onLogout, onOpenSupportMessages }: AdminHeaderProps) {
  const navigate = useNavigate();
  const { mostrarFeedback, mostrarToast } = useFeedback();
  const [pendingSupportCount, setPendingSupportCount] = useState(0);
  const [pendingPreview, setPendingPreview] = useState<Array<{ id: string; nome: string; mensagem: string; created_at: string }>>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: string; message: string }>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    let unsubUpdate: (() => void) | undefined;
    let unsubWindow: (() => void) | undefined;
    const desktopApi = window.funsepDesktop;
    if (!desktopApi) return;

    setIsDesktop(true);

    desktopApi.getWindowState().then((state) => {
      setWindowMaximized(Boolean(state?.maximized));
    }).catch(() => {
      // noop
    });

    unsubUpdate = desktopApi.onAutoUpdateStatus((payload) => {
      setUpdateStatus({
        type: payload?.type || "idle",
        message: payload?.message || "",
      });

      if (payload?.type === "downloaded") {
        mostrarToast("sucesso", payload.message || "Atualização pronta para instalar.");
      }
    });
    unsubWindow = desktopApi.onWindowState((payload) => {
      setWindowMaximized(Boolean(payload?.maximized));
    });

    return () => {
      if (unsubUpdate) unsubUpdate();
      if (unsubWindow) unsubWindow();
    };
  }, [mostrarToast]);

  const handleWindowControl = async (action: "minimize" | "toggle-maximize" | "close") => {
    const desktopApi = window.funsepDesktop;
    if (!desktopApi) return;
    try {
      await desktopApi.windowControl(action);
    } catch {
      // noop
    }
  };

  const handleCheckUpdates = async () => {
    const desktopApi = window.funsepDesktop;
    if (!desktopApi) return;

    if (updateStatus.type === "downloaded") {
      await desktopApi.quitAndInstall();
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const result = await desktopApi.checkUpdates();
      if (!result?.ok && result?.reason && result.reason !== "busy") {
        mostrarFeedback("erro", "Atualização", result.reason);
      }
    } catch (error) {
      mostrarFeedback("erro", "Atualização", "Falha ao verificar atualizações.");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    if (!rolesWithSupportAccess.includes(session.user.cargo)) {
      setPendingSupportCount(0);
      return;
    }

    const loadPendingCount = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id, nome, mensagem, created_at, updated_at, status, origem, created_by_sigla, target_sigla, awaiting_party")
        .order("created_at", { ascending: false })
        .limit(80);

      const openRows = (data || []).filter((item) => {
        if (!(item.status === "PENDENTE" || item.status === "EM_ANALISE")) return false;

        if (item.origem === "ADMIN_INTERNO") {
          if (item.awaiting_party === "DESTINATARIO_INTERNO") return item.target_sigla === session.user.sigla;
          if (item.awaiting_party === "REMETENTE_INTERNO") return item.created_by_sigla === session.user.sigla;
          return item.target_sigla === session.user.sigla;
        }

        if (item.origem === "ADMIN_ASSOCIADO") {
          return item.created_by_sigla === session.user.sigla && item.awaiting_party === "EQUIPE";
        }

        return item.awaiting_party === "EQUIPE" || !item.awaiting_party;
      });

      setPendingSupportCount(openRows.length || 0);
      setPendingPreview(
        openRows.slice(0, 5).map((item) => ({
          id: item.id,
          nome: item.nome,
          mensagem: item.mensagem,
          created_at: item.updated_at || item.created_at,
        })) as Array<{ id: string; nome: string; mensagem: string; created_at: string }>
      );
    };

    loadPendingCount();
    const interval = window.setInterval(loadPendingCount, 30000);
    return () => window.clearInterval(interval);
  }, [session.user.cargo, session.user.sigla]);

  return (
    <header className="bg-card border-b border-border fixed top-0 left-0 md:left-[var(--sidebar-width)] right-0 z-30 w-full md:w-[calc(100%-var(--sidebar-width))] overflow-x-hidden">
      {isDesktop && (
        <div className="desktop-drag-region h-10 border-b border-border/70 px-3 sm:px-4 flex items-center justify-between bg-card/95">
          <p className="text-xs text-muted-foreground tracking-wide">FUNSEP Admin</p>
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
      )}

      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SidebarTrigger className="md:hidden flex-shrink-0" />
          
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Gestão do sistema FUNSEP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {!isDesktop && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              title="Voltar ao Início"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {isDesktop && (
            <Button
              variant="outline"
              className="hidden md:flex h-9 gap-2"
              onClick={handleCheckUpdates}
              title={updateStatus.message || "Verificar atualização do app desktop"}
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingUpdate || updateStatus.type === "checking" ? "animate-spin" : ""}`} />
              <span>
                {updateStatus.type === "downloaded"
                  ? "Reiniciar e Atualizar"
                  : updateStatus.type === "checking" || isCheckingUpdate
                    ? "Verificando..."
                    : "Atualizar App"}
              </span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex relative"
                title="Ocorrências do sistema"
              >
                <Bell className="h-5 w-5" />
                {pendingSupportCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                    {pendingSupportCount > 99 ? "99+" : pendingSupportCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Ocorrências em aberto</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pendingPreview.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma pendência no momento</div>
              ) : (
                pendingPreview.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex flex-col items-start gap-1 py-3"
                    onClick={onOpenSupportMessages}
                  >
                    <p className="text-sm font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.mensagem}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSupportMessages}>
                Abrir ocorrências do sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 md:px-3 h-8 sm:h-9">
                <Avatar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {session.user.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block min-w-0">
                  <p className="text-sm font-medium truncate">{session.user.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.cargo}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session.user.nome}</p>
                  <p className="text-xs text-muted-foreground">{session.user.sigla} - {session.user.cargo}</p>
                  <p className="text-xs text-muted-foreground">{session.user.secao}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
