import React from "react";
import { LayoutDashboard, Users, UserPlus, Shield, Key, Newspaper, FileText, LogOut, BarChart3, TrendingUp, Activity, Clock, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSession } from "@/services/adminAuth";
import { AdminPageType } from "@/pages/AdminDashboard";
import funsepLogo from "@/assets/funsep-logo.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
interface AdminSidebarProps {
  currentPage: AdminPageType;
  onPageChange: (page: AdminPageType) => void;
  session: AdminSession;
  onLogout: () => void;
  onGoHome?: () => void;
}
const navigation = [{
  id: 'dashboard' as AdminPageType,
  label: 'Dashboard',
  icon: LayoutDashboard
}, {
  id: 'mensagens-suporte' as AdminPageType,
  label: 'Ocorrências Sistema',
  icon: MessageSquare
}, {
  id: 'beneficiarios' as AdminPageType,
  label: 'Associados',
  icon: Users
}, {
  id: 'dependentes' as AdminPageType,
  label: 'Dependentes',
  icon: UserPlus
}, {
  id: 'usuarios' as AdminPageType,
  label: 'Colaboradores',
  icon: Shield
}, {
  id: 'senhas' as AdminPageType,
  label: 'Usuários Associados',
  icon: Key
}, {
  id: 'noticias' as AdminPageType,
  label: 'Notícias',
  icon: Newspaper
}, {
  id: 'sobre-funsep' as AdminPageType,
  label: 'Sobre o FUNSEP',
  icon: FileText
}, {
  id: 'requerimentos' as AdminPageType,
  label: 'Requerimentos',
  icon: FileText
}, {
  id: 'relatorios' as AdminPageType,
  label: 'Relatórios',
  icon: BarChart3
}, {
  id: 'estatisticas-relatorios' as AdminPageType,
  label: 'Estatísticas de Relatórios',
  icon: TrendingUp
}, {
  id: 'auditoria' as AdminPageType,
  label: 'Auditoria',
  icon: Activity,
  requiresDeveloper: true
}, {
  id: 'controle-redefinicoes' as AdminPageType,
  label: 'Controle Redefinições',
  icon: Clock,
  requiresDeveloper: true
}];
export function AdminSidebar({
  currentPage,
  onPageChange,
  session,
  onLogout,
  onGoHome
}: AdminSidebarProps) {
  const [supportPendingCount, setSupportPendingCount] = React.useState(0);
  const isDesktopApp = typeof window !== "undefined" && !!window.funsepDesktop;
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const collapsed = state === "collapsed";

  React.useEffect(() => {
    const canSee = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'].includes(session?.user?.cargo || '');
    if (!canSee) {
      setSupportPendingCount(0);
      return;
    }

    const loadPending = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id, status, origem, created_by_sigla, target_sigla, awaiting_party");

      const openCount = (data || []).filter((item) => {
        if (!(item.status === 'PENDENTE' || item.status === 'EM_ANALISE')) return false;

        if (item.origem === 'ADMIN_INTERNO') {
          if (item.awaiting_party === 'DESTINATARIO_INTERNO') return item.target_sigla === session.user.sigla;
          if (item.awaiting_party === 'REMETENTE_INTERNO') return item.created_by_sigla === session.user.sigla;
          return item.target_sigla === session.user.sigla;
        }

        if (item.origem === 'ADMIN_ASSOCIADO') {
          return item.created_by_sigla === session.user.sigla && item.awaiting_party === 'EQUIPE';
        }

        return item.awaiting_party === 'EQUIPE' || !item.awaiting_party;
      }).length;
      setSupportPendingCount(openCount || 0);
    };

    loadPending();
    const interval = window.setInterval(loadPending, 30000);
    return () => window.clearInterval(interval);
  }, [session?.user?.cargo, session?.user?.sigla]);

  return <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r">
      <SidebarHeader className="p-4 sm:p-5 md:p-6 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          {!collapsed && <div className="min-w-0">
              <h1 className="font-bold text-lg sm:text-xl truncate">FUNSEP Admin</h1>
              <p className="text-sm text-muted-foreground truncate">Painel Administrativo</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 sm:px-3 text-sm">Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(item => {
              if (item.requiresDeveloper && session?.user?.cargo !== 'DESENVOLVEDOR') {
                return null;
              }
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      onClick={() => {
                        onPageChange(item.id);
                        // Close sidebar on mobile after selection
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }} 
                      className="h-11 sm:h-12 px-2 sm:px-3"
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-[15px] sm:text-base">{item.label}</span>
                      {item.id === 'mensagens-suporte' && supportPendingCount > 0 && !collapsed && (
                        <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                          {supportPendingCount > 99 ? "99+" : supportPendingCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 sm:p-4 border-t mt-auto">
        {!collapsed && (
          session ? (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="font-medium truncate text-base">{session.user.nome}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="truncate">{session.user.cargo}</p>
                <p className="truncate">{session.user.sigla}</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 opacity-50" />
                <span className="font-medium truncate text-base">Visitante</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="truncate">Não logado</p>
              </div>
            </div>
          )
        )}
        {session && (
          <div className={`grid gap-2 ${collapsed || isDesktopApp ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {!isDesktopApp && onGoHome && (
              <Button
                variant="outline"
                className={`gap-2 h-9 text-sm ${collapsed ? 'w-full px-0' : 'w-full'}`}
                onClick={onGoHome}
                title="Ir para Home"
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>Home</span>}
              </Button>
            )}
            <Button
              variant="outline"
              className={`gap-2 h-9 text-sm ${collapsed ? 'w-full px-0' : 'w-full'}`}
              onClick={onLogout}
              title="Sair"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Sair</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>;
}
