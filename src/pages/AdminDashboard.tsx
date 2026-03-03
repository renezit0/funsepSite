import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth, AdminSession } from "@/services/adminAuth";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardPage } from "@/components/admin/pages/DashboardPage";
import { BeneficiariesPage } from "@/components/admin/pages/BeneficiariesPage";
import { DependentsPage } from "@/components/admin/pages/DependentsPage";
import { UsersPage } from "@/components/admin/pages/UsersPage";
import { PasswordsPage } from "@/components/admin/pages/PasswordsPage";
import { NewsPage } from "@/components/admin/pages/NewsPage";
import { ReportsPage } from "@/components/admin/pages/ReportsPage";
import { ReportsStatsPage } from "@/components/admin/pages/ReportsStatsPage";
import { RequestsPage } from "@/components/admin/pages/RequestsPage";
import { SupportMessagesPage } from "@/components/admin/pages/SupportMessagesPage";
import { SobreFunsepManagementPage } from "@/components/admin/pages/SobreFunsepManagementPage";
import { AuditLogsPage } from "@/components/admin/pages/AuditLogsPage";
import { ResetControlPage } from "@/components/admin/pages/ResetControlPage";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { extractClickInfo, logAuditEvent } from "@/utils/auditLogger";

export type AdminPageType = 'dashboard' | 'beneficiarios' | 'dependentes' | 'usuarios' | 'senhas' | 'controle-redefinicoes' | 'noticias' | 'relatorios' | 'estatisticas-relatorios' | 'requerimentos' | 'mensagens-suporte' | 'sobre-funsep' | 'auditoria';

export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState<AdminPageType>('dashboard');
  const [session, setSession] = useState<AdminSession | null>(null);
  const currentPageRef = useRef(currentPage);
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const isDesktopApp = typeof window !== "undefined" && !!window.funsepDesktop;

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await adminAuth.validateSession();
      if (!isValid) {
        navigate(isDesktopApp ? '/admin' : '/');
        return;
      }
      
      const currentSession = adminAuth.getSession();
      
      // CRITICAL SECURITY CHECK: Verify user is actually an admin
      const adminRoles = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'];
      if (!currentSession || !adminRoles.includes(currentSession.user.cargo)) {
        console.error('Unauthorized access attempt to admin panel');
        await adminAuth.logout();
        navigate(isDesktopApp ? '/admin' : '/');
        return;
      }
      
      setSession(currentSession);
    };

    checkAuth();
  }, [isDesktopApp, navigate]);

  const handleLogout = async () => {
    try {
      // Fazer logout no admin auth
      await adminAuth.logout();
      
      // Fazer logout no auth context principal
      await authLogout();
      
      // Limpar estados locais
      setSession(null);
      setCurrentPage('dashboard');
      
      // Redirecionar para home
      navigate(isDesktopApp ? '/admin' : '/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tentar redirecionar
      navigate(isDesktopApp ? '/admin' : '/');
    }
  }

  const auditUser = useMemo(() => {
    if (!session) return null;
    return {
      sigla: session.user.sigla,
      matricula: session.user.matricula ?? null,
      nome: session.user.nome,
      cargo: session.user.cargo,
      isAdmin: true
    };
  }, [session]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (!auditUser) return;
    logAuditEvent({
      eventType: "tab_view",
      page: currentPage,
      label: `admin:${currentPage}`,
      appArea: "admin",
      user: auditUser
    });
  }, [currentPage, auditUser]);

  useEffect(() => {
    if (!auditUser) return;
    const handleDocumentClick = (event: MouseEvent) => {
      const info = extractClickInfo(event);
      if (!info) return;

      logAuditEvent({
        eventType: "click",
        page: currentPageRef.current,
        label: info.label,
        element: info.element,
        target: info.target,
        appArea: "admin",
        user: auditUser
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [auditUser]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'beneficiarios':
        return <BeneficiariesPage />;
      case 'dependentes':
        return <DependentsPage />;
      case 'usuarios':
        return <UsersPage />;
      case 'senhas':
        return <PasswordsPage />;
      case 'controle-redefinicoes':
        if (session.user.cargo !== 'DESENVOLVEDOR') {
          return (
            <div className="text-sm text-muted-foreground">
              Acesso restrito aos desenvolvedores.
            </div>
          );
        }
        return <ResetControlPage />;
      case 'noticias':
        return <NewsPage />;
      case 'relatorios':
        return <ReportsPage />;
      case 'estatisticas-relatorios':
        return <ReportsStatsPage />;
      case 'requerimentos':
        return <RequestsPage />;
      case 'mensagens-suporte':
        return <SupportMessagesPage />;
      case 'sobre-funsep':
        return <SobreFunsepManagementPage />;
      case 'auditoria':
        if (session.user.cargo !== 'DESENVOLVEDOR') {
          return (
            <div className="text-sm text-muted-foreground">
              Acesso restrito aos desenvolvedores.
            </div>
          );
        }
        return <AuditLogsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          session={session}
          onLogout={handleLogout}
          onGoHome={() => navigate(isDesktopApp ? '/admin' : '/')}
        />
        
        <SidebarInset className={`w-full max-w-full overflow-x-hidden flex flex-col ${isDesktopApp ? 'pt-[104px] sm:pt-[108px] md:pt-[112px]' : 'pt-16 sm:pt-[72px] md:pt-[78px]'}`}>
          <AdminHeader
            session={session}
            onLogout={handleLogout}
            onOpenSupportMessages={() => setCurrentPage('mensagens-suporte')}
          />
          
          <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto overflow-x-hidden min-h-0 w-full max-w-full">
            {renderPage()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AdminDashboard;
