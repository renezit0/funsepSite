import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Book, Gavel, FileText, BarChart3, Settings, ClipboardList } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/modals/LoginModal";
import { HomePage } from "@/components/pages/HomePage";
import { NewsPage } from "@/components/pages/NewsPage";
import { BenefitsPage } from "@/components/pages/BenefitsPage";
import { InstructionsPage } from "@/components/pages/InstructionsPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { HealthTipsPage } from "@/components/pages/HealthTipsPage";
import { LinksPage } from "@/components/pages/LinksPage";
import { StatutePage } from "@/components/pages/StatutePage";
import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { ReportsPage } from "@/components/pages/ReportsPage";
import { RequestsPage } from "@/components/pages/RequestsPage";
import { MyRequestsPage } from "@/components/pages/MyRequestsPage";
import { SobreFunsepPage } from "@/components/pages/SobreFunsepPage";
import { extractClickInfo, logAuditEvent } from "@/utils/auditLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ViewReportByToken } from "@/components/pages/ViewReportByToken";
import { useLocation, useNavigate } from "react-router-dom";
import ResetPassword from "./ResetPassword";
import { BeneficiaryOccurrencesPage } from "@/components/pages/BeneficiaryOccurrencesPage";

const pageConfig = {
  home: { title: "Início", component: HomePage, type: "home" as const },
  "sobre-funsep": { title: "Sobre o FUNSEP", component: SobreFunsepPage, type: "regular" as const },
  news: { title: "Notícias", component: NewsPage, type: "regular" as const },
  benefits: { title: "Vantagens", component: BenefitsPage, type: "regular" as const },
  instructions: { title: "Instruções", component: InstructionsPage, type: "regular" as const },
  statute: { title: "Estatuto", component: StatutePage, type: "regular" as const },
  requests: { title: "Requerimentos", component: RequestsPage, type: "regular" as const },
  myRequests: { title: "Meus Requerimentos", component: MyRequestsPage, type: "regular" as const },
  reports: { title: "Relatórios", component: ReportsPage, type: "regular" as const },
  occurrences: { title: "Minhas Ocorrências", component: BeneficiaryOccurrencesPage, type: "regular" as const },
  admin: { title: "Administração", component: PlaceholderPage, icon: Settings, type: "placeholder" as const },
  contact: { title: "Localização e Contato", component: ContactPage, type: "regular" as const },
  healthtips: { title: "Dicas de Saúde", component: HealthTipsPage, type: "regular" as const },
  links: { title: "Links", component: LinksPage, type: "regular" as const },
};

const Index = () => {
  const { isAuthenticated, session } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [validateByUrlModalOpen, setValidateByUrlModalOpen] = useState(false);
  const [resetByHashOpen, setResetByHashOpen] = useState(false);
  const currentPageRef = useRef(currentPage);
  const location = useLocation();
  const navigate = useNavigate();

  const auditUser = useMemo(() => {
    if (!session) return null;
    const adminRoles = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'];
    const isAdminUser = session.user.cargo ? adminRoles.includes(session.user.cargo) : false;
    return {
      sigla: session.user.sigla,
      matricula: session.user.matricula ?? null,
      nome: session.user.nome,
      cargo: session.user.cargo,
      isAdmin: isAdminUser
    };
  }, [session]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openLoginModal = () => {
    setLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
  };

  // Extract base page name without query params
  const basePageName = currentPage.split('?')[0];
  const currentPageConfig = pageConfig[basePageName as keyof typeof pageConfig] || pageConfig.home;

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    logAuditEvent({
      eventType: "tab_view",
      page: currentPage,
      label: currentPageConfig.title,
      appArea: "public",
      user: auditUser
    });
  }, [currentPage, currentPageConfig.title, auditUser]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const info = extractClickInfo(event);
      if (!info) return;

      logAuditEvent({
        eventType: "click",
        page: currentPageRef.current,
        label: info.label,
        element: info.element,
        target: info.target,
        appArea: "public",
        user: auditUser
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [auditUser]);

  useEffect(() => {
    if (location.pathname === "/valida-token") {
      setValidateByUrlModalOpen(true);
      setCurrentPage("home");
    }
  }, [location.pathname]);

  useEffect(() => {
    setResetByHashOpen(location.hash.startsWith("#/redefinir-senha/"));
  }, [location.hash]);

  const handleCloseValidateModal = (open: boolean) => {
    setValidateByUrlModalOpen(open);
    if (!open && location.pathname === "/valida-token") {
      navigate("/", { replace: true });
    }
  };

  if (resetByHashOpen) {
    return <ResetPassword />;
  }

  return (
    <div className="min-h-screen bg-bg-secondary overflow-x-hidden w-full max-w-full">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLoginClick={openLoginModal}
        onOpenOccurrence={() => setCurrentPage("occurrences")}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      
      <div className="lg:ml-sidebar lg:w-[calc(100%-var(--sidebar-width))] w-full overflow-x-hidden">
        <Header
          title={currentPageConfig.title}
          onMenuToggle={toggleSidebar}
          onLoginClick={openLoginModal}
          onOpenOccurrence={() => setCurrentPage("occurrences")}
          isAuthenticated={isAuthenticated}
        />
        
        <main className="p-3 sm:p-4 lg:p-6 overflow-x-hidden w-full" style={{ paddingTop: 'calc(var(--header-height) + 0.75rem)' }}>
          {currentPageConfig.type === "placeholder" && (
            <PlaceholderPage 
              title={currentPageConfig.title}
              icon={currentPageConfig.icon!}
            />
          )}
          {currentPageConfig.type === "home" && (
            <HomePage onNavigate={handlePageChange} />
          )}
          {currentPageConfig.type === "regular" && currentPage.startsWith("sobre-funsep") && (
            <SobreFunsepPage 
              slug={currentPage.includes('?') ? currentPage.split('?secao=')[1] : 'quem-somos'} 
            />
          )}
          {currentPageConfig.type === "regular" && currentPage === "news" && (
            <NewsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "benefits" && (
            <BenefitsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "instructions" && (
            <InstructionsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "contact" && (
            <ContactPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "healthtips" && (
            <HealthTipsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "links" && (
            <LinksPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "statute" && (
            <StatutePage />
          )}
          {currentPageConfig.type === "regular" && currentPage.startsWith("requests") && (
            <RequestsPage currentPage={currentPage} />
          )}
          {currentPageConfig.type === "regular" && currentPage === "myRequests" && (
            <MyRequestsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "reports" && (
            <ReportsPage />
          )}
          {currentPageConfig.type === "regular" && currentPage === "occurrences" && (
            <BeneficiaryOccurrencesPage />
          )}
        </main>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
      />

      <Dialog open={validateByUrlModalOpen} onOpenChange={handleCloseValidateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validação de Relatório</DialogTitle>
          </DialogHeader>
          <ViewReportByToken />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
