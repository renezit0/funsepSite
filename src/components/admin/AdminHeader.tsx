import React from "react";
import { Bell, RefreshCw, LogOut, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSession } from "@/services/adminAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AdminHeaderProps {
  session: AdminSession;
  onLogout: () => void;
}

export function AdminHeader({ session, onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 fixed top-0 left-0 md:left-[var(--sidebar-width)] right-0 z-30 w-full md:w-[calc(100%-var(--sidebar-width))] overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SidebarTrigger className="md:hidden flex-shrink-0" />
          
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold truncate">Painel Administrativo</h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Gestão do sistema FUNSEP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => { window.location.hash = '#/'; }}
            title="Voltar ao Início"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Home className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden md:flex">
            <RefreshCw className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="h-5 w-5" />
          </Button>

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