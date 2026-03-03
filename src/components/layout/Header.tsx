import { useEffect, useState } from "react";
import { Menu, Bell, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
  onLoginClick: () => void;
  onOpenOccurrence?: () => void;
  isAuthenticated?: boolean;
}

interface NotificationPreview {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

const adminRoles = ["GERENTE", "ANALISTA DE SISTEMAS", "DESENVOLVEDOR"];
const normalizeStatus = (status: string) => (status === "RESPONDIDO" ? "ATENDIDO" : status);

export function Header({ title, onMenuToggle, onLoginClick, onOpenOccurrence, isAuthenticated = false }: HeaderProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [previews, setPreviews] = useState<NotificationPreview[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !session?.user) {
      setNotificationCount(0);
      setPreviews([]);
      return;
    }

    const loadNotifications = async () => {
      const isAdmin = adminRoles.includes(session.user.cargo || "");

      if (isAdmin) {
        const { data } = await supabase
          .from("support_messages")
          .select("id, nome, mensagem, created_at, updated_at, status, origem, created_by_sigla, target_sigla, awaiting_party")
          .order("created_at", { ascending: false })
          .limit(80);

        const actionableRows = (data || []).filter((item) => {
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

        setNotificationCount(actionableRows.length || 0);
        setPreviews(
          actionableRows.slice(0, 5).map((item) => ({
            id: item.id,
            title: `Ocorrência pendente: ${item.nome}`,
            description: String(item.mensagem || "").slice(0, 90),
            createdAt: item.updated_at || item.created_at,
          }))
        );
        return;
      }

      const matricula = Number(session.user.matricula || 0);
      if (!matricula) {
        setNotificationCount(0);
        setPreviews([]);
        return;
      }

      const { data } = await supabase
        .from("support_messages")
        .select("id, mensagem, status, origem, awaiting_party, created_at, updated_at")
        .eq("matricula", matricula)
        .order("updated_at", { ascending: false })
        .limit(30);

      const rows = data || [];
      const actionableRows = rows.filter((row) => {
        if (normalizeStatus(row.status) === "ATENDIDO") return false;
        if (row.awaiting_party === "ASSOCIADO") return true;
        if (!row.awaiting_party && row.origem === "ADMIN_ASSOCIADO") return true;
        return false;
      });

      setNotificationCount(actionableRows.length);
      setPreviews(
        actionableRows.slice(0, 5).map((item) => ({
          id: item.id,
          title:
            normalizeStatus(item.status) === "ATENDIDO"
              ? "Ocorrência atendida"
              : normalizeStatus(item.status) === "EM_ANALISE"
                ? "Ocorrência em análise"
                : "Ocorrência pendente",
          description: String(item.mensagem || "").slice(0, 90),
          createdAt: item.updated_at || item.created_at,
        }))
      );
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, session?.user?.cargo, session?.user?.matricula]);

  return (
    <header className="h-header bg-background border-b border-border px-4 sm:px-6 flex items-center justify-between fixed top-0 left-0 lg:left-[var(--sidebar-width)] right-0 z-50 w-full lg:w-[calc(100%-var(--sidebar-width))] overflow-x-hidden">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 lg:flex-initial">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-10 w-10 p-0 text-foreground hover:bg-accent flex-shrink-0"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo no mobile, título no desktop */}
        <div className="flex-1 lg:flex-initial flex justify-center lg:justify-start">
          <img
            src="/images/logo-funsep-completa.svg"
            alt="FUNSEP"
            className="w-[170px] sm:w-[190px] h-auto lg:hidden"
          />
          <h1 className="hidden lg:block text-xl lg:text-2xl font-semibold text-foreground">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications - Only show when authenticated */}
        {isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 relative text-foreground hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive rounded-full text-[10px] leading-none text-destructive-foreground flex items-center justify-center font-semibold">
                  {notificationCount}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {previews.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Nenhuma notificação no momento
                </div>
              ) : (
                <>
                  {previews.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="flex flex-col items-start gap-1 py-3"
                      onClick={() => {
                        if ((session?.user?.cargo || "") === "ASSOCIADO") {
                          onOpenOccurrence?.();
                          return;
                        }
                        if (adminRoles.includes(session?.user?.cargo || "")) {
                          navigate("/admin");
                        }
                      }}
                    >
                      <div className="w-full flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </DropdownMenuItem>
                  ))}
                  {(session?.user?.cargo || "") === "ASSOCIADO" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onOpenOccurrence}>
                        Ver minhas ocorrências
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Avatar */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={onLoginClick}
        >
          <Avatar className="h-8 w-8 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}
