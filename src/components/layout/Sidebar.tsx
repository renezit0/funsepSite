import { useState, useEffect } from "react";
import { Home, Newspaper, Star, Book, Gavel, FileText, BarChart3, Settings, Mail, MapPin, Heart, ExternalLink, User, LogIn, Shield, LogOut, ClipboardList, Info, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import funsepLogo from "@/assets/funsep-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SobreFunsepSecao {
  id: string;
  titulo: string;
  slug: string;
  ordem: number;
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLoginClick: () => void;
  onOpenOccurrence?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { id: "home", label: "Início", icon: Home },
  { id: "sobre-funsep", label: "Sobre o FUNSEP", icon: Info, hasSubmenu: true },
  { id: "news", label: "Notícias", icon: Newspaper },
  { id: "benefits", label: "Vantagens", icon: Star },
  { id: "instructions", label: "Instruções", icon: Book },
  { id: "statute", label: "Estatuto", icon: Gavel },
  { id: "requests", label: "Requerimentos", icon: FileText, hasSubmenu: true },
  { id: "myRequests", label: "Meus Requerimentos", icon: ClipboardList, requiresAuth: true },
  { id: "open-occurrence", label: "Abrir Ocorrência", icon: MessageSquare, requiresAuth: true, requiresBeneficiary: true },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "admin", label: "Administração", icon: Settings },
  { id: "contact", label: "Localização e Contato", icon: MapPin },
  { id: "healthtips", label: "Dicas de Saúde", icon: Heart },
  { id: "links", label: "Links", icon: ExternalLink },
];

const tiposRequerimento = [
  { id: "exclusao-associado", label: "Exclusão de Associado" },
  { id: "exclusao-dependente", label: "Exclusão de Dependente" },
  { id: "inclusao-associado", label: "Inclusão de Associado" },
  { id: "inclusao-dependente", label: "Inclusão de Dependente" },
  { id: "inclusao-recem-nascido", label: "Inclusão de Recém-Nascido" },
  { id: "inscricao-pensionista", label: "Inscrição de Pensionista" },
  { id: "requerimento-21-anos", label: "Requerimento - 21 Anos" },
  { id: "requerimento-diversos", label: "Requerimento - Diversos" },
  { id: "requerimento-reembolso", label: "Requerimento - Reembolso" },
  { id: "termo-ciencia", label: "Termo de Ciência" },
  { id: "termo-opcoes", label: "Termo de Opção" },
];

export function Sidebar({ currentPage, onPageChange, onLoginClick, onOpenOccurrence, isOpen, onToggle }: SidebarProps) {
  const { isAuthenticated, session, logout } = useAuth();
  const navigate = useNavigate();
  const [occurrencePendingCount, setOccurrencePendingCount] = useState(0);
  const [sobreFunsepExpanded, setSobreFunsepExpanded] = useState(false);
  const [sobreFunsepSecoes, setSobreFunsepSecoes] = useState<SobreFunsepSecao[]>([]);
  const [requerimentosExpanded, setRequerimentosExpanded] = useState(false);

  useEffect(() => {
    loadSobreFunsepSecoes();
  }, []);

  useEffect(() => {
    const isBeneficiary = session?.user?.cargo === "ASSOCIADO";
    const matricula = Number(session?.user?.matricula || 0);

    if (!isAuthenticated || !isBeneficiary || !matricula) {
      setOccurrencePendingCount(0);
      return;
    }

    const loadPending = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id, status, origem, awaiting_party")
        .eq("matricula", matricula)
        .order("updated_at", { ascending: false })
        .limit(50);

      const actionable = (data || []).filter((row) => {
        if (row.status === "ATENDIDO" || row.status === "RESPONDIDO") return false;
        if (row.awaiting_party === "ASSOCIADO") return true;
        if (!row.awaiting_party && row.origem === "ADMIN_ASSOCIADO") return true;
        return false;
      });

      setOccurrencePendingCount(actionable.length || 0);
    };

    loadPending();
    const interval = window.setInterval(loadPending, 30000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, session?.user?.cargo, session?.user?.matricula]);

  const loadSobreFunsepSecoes = async () => {
    const { data } = await supabase
      .from("sobre_funsep")
      .select("id, titulo, slug, ordem")
      .eq("publicado", true)
      .order("ordem", { ascending: true });
    
    if (data) {
      setSobreFunsepSecoes(data);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    if (typeof onPageChange === 'function') {
      onPageChange('home');
    }
  };

  const isAdmin = session?.user.cargo && ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'].includes(session.user.cargo);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[70] lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-sidebar bg-sidebar border-r border-sidebar-border z-[80] lg:z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header with Logo */}
        <div className="p-2 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <img 
              src="/images/logo-funsep-completa.svg" 
              alt="FUNSEP" 
              className="w-full max-w-[220px] h-auto"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4">
          <nav className="py-6 space-y-2">
            {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            // Esconder "Meus Requerimentos" se não estiver logado
            if (item.requiresAuth && !isAuthenticated) {
              return null;
            }
            
            // Hide admin link if not admin
            if (item.id === "admin" && !isAdmin) {
              return null;
            }
            
            // Hide other admin-only items if not admin or beneficiary
            const isBeneficiary = session?.user.cargo === 'ASSOCIADO';
            if ((item.id === "reports") && !isAdmin && !isBeneficiary) {
              return null;
            }

            if ((item as any).requiresBeneficiary && !isBeneficiary) {
              return null;
            }

            if (item.id === "open-occurrence") {
              const occurrenceActive = currentPage === "occurrences";
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    occurrenceActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""
                  }`}
                  onClick={() => {
                    onOpenOccurrence?.();
                    if (window.innerWidth < 1024) onToggle();
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {occurrencePendingCount > 0 && (
                    <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                      {occurrencePendingCount > 99 ? "99+" : occurrencePendingCount}
                    </span>
                  )}
                </Button>
              );
            }
            
            // Special handling for admin link - redirect same tab
            if (item.id === "admin") {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => {
                    navigate('/admin');
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            }
            
            // Special handling for Sobre o FUNSEP - expandable menu
            if (item.id === "sobre-funsep") {
              return (
                <div key={item.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => setSobreFunsepExpanded(!sobreFunsepExpanded)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {sobreFunsepExpanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Button>

                  {sobreFunsepExpanded && (
                    <div className="ml-8 space-y-1">
                      {sobreFunsepSecoes.map((secao) => (
                        <Button
                          key={secao.id}
                          variant="ghost"
                          className="w-full justify-start h-10 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          onClick={() => {
                            onPageChange(`sobre-funsep?secao=${secao.slug}`);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                        >
                          {secao.titulo}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Special handling for Requerimentos - expandable menu
            if (item.id === "requests") {
              const isRequerimentoActive = currentPage.startsWith("requests?tipo=");
              const tipoAtivo = isRequerimentoActive ? currentPage.split('?tipo=')[1] : null;

              return (
                <div key={item.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => setRequerimentosExpanded(!requerimentosExpanded)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                    {requerimentosExpanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Button>

                  {requerimentosExpanded && (
                    <div className="ml-8 space-y-1">
                      {tiposRequerimento.map((tipo) => {
                        const isThisTipoActive = tipoAtivo === tipo.id;
                        return (
                          <Button
                            key={tipo.id}
                            variant={isThisTipoActive ? "default" : "ghost"}
                            className={`
                              w-full justify-start h-10 text-sm
                              ${isThisTipoActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }
                            `}
                            onClick={() => {
                              onPageChange(`requests?tipo=${tipo.id}`);
                              if (window.innerWidth < 1024) onToggle();
                            }}
                          >
                            {tipo.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`
                  w-full justify-start gap-3 h-12 font-medium
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
                onClick={() => {
                  onPageChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border space-y-2 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {isAuthenticated ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              {isAuthenticated ? (
                <>
                  <p className="text-sm font-medium text-sidebar-foreground">{session?.user.nome}</p>
                  <p className="text-xs text-muted-foreground">{session?.user.cargo}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-sidebar-foreground">Visitante</p>
                  <p className="text-xs text-muted-foreground">Não logado</p>
                </>
              )}
            </div>
            
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-border"
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-sidebar-foreground hover:bg-sidebar-border"
                onClick={onLoginClick}
                title="Fazer Login"
              >
                <LogIn className="h-4 w-4" />
              </Button>
            )}
          </div>
          
        </div>
      </aside>
    </>
  );
}
