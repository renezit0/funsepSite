import React from "react";
import { LayoutDashboard, Users, UserPlus, Shield, Key, Newspaper, FileText, LogOut, BarChart3, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSession } from "@/services/adminAuth";
import { AdminPageType } from "@/pages/AdminDashboard";
import funsepLogo from "@/assets/funsep-logo.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
interface AdminSidebarProps {
  currentPage: AdminPageType;
  onPageChange: (page: AdminPageType) => void;
  session: AdminSession;
  onLogout: () => void;
}
const navigation = [{
  id: 'dashboard' as AdminPageType,
  label: 'Dashboard',
  icon: LayoutDashboard
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
  label: 'Usuários',
  icon: Shield
}, {
  id: 'senhas' as AdminPageType,
  label: 'Senhas',
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
}];
export function AdminSidebar({
  currentPage,
  onPageChange,
  session,
  onLogout
}: AdminSidebarProps) {
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const collapsed = state === "collapsed";
  return <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r">
      <SidebarHeader className="p-4 sm:p-5 md:p-6 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          {!collapsed && <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg truncate">FUNSEP Admin</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Painel Administrativo</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 sm:px-3">Administração</SidebarGroupLabel>
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
                      className="h-10 sm:h-12 px-2 sm:px-3"
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">{item.label}</span>
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
                <span className="font-medium truncate text-sm sm:text-base">{session.user.nome}</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="truncate">{session.user.cargo}</p>
                <p className="truncate">{session.user.sigla}</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 opacity-50" />
                <span className="font-medium truncate text-sm sm:text-base">Visitante</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="truncate">Não logado</p>
              </div>
            </div>
          )
        )}
        {session && (
          <Button
            variant="outline"
            className="w-full gap-2 h-10 sm:h-12 text-sm sm:text-base"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>;
}