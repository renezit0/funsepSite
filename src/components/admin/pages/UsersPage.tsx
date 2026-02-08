import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Shield, Pencil, UserPlus, Filter, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { EditUserModal } from "@/components/modals/EditUserModal";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface User {
  sigla: string;
  nome: string;
  cargo: string;
  secao: string;
  senha: string;
  status: string;
}

export function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const canManageUsers = session?.user?.cargo &&
    ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'].includes(session.user.cargo);

  const SkeletonRow = () => (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-10 w-10 rounded-full"></div>
            <div className="space-y-2">
              <div className="skeleton-shimmer h-5 w-48 rounded"></div>
              <div className="skeleton-shimmer h-4 w-32 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton-shimmer h-6 w-24 rounded"></div>
            <div className="skeleton-shimmer h-6 w-20 rounded"></div>
          </div>
        </div>
        <div className="skeleton-shimmer h-9 w-20 rounded"></div>
      </div>
    </div>
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('sigla, nome, cargo, secao, senha, status')
        .order('nome');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    // Filtrar por status (mostrar inativos apenas se o toggle estiver ativo)
    if (!showInactive && user.status !== 'ATIVO') return false;
    
    return searchTerm === "" || 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sigla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.secao?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 sm:h-8 sm:w-8" />
            Usuários do Sistema
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerenciamento de usuários administrativos
          </p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            <span className="sm:inline">Adicionar Usuário</span>
          </Button>
        )}
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Usuários</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gerencie usuários administrativos do sistema. Apenas usuários com permissão podem adicionar ou editar outros usuários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, sigla, cargo ou seção..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="cursor-pointer text-sm whitespace-nowrap">
            Mostrar inativos
          </Label>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="skeleton-shimmer h-5 w-48 rounded inline-block"></span>
              </span>
            ) : (
            `Usuários encontrados (${filteredUsers.length})`
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : filteredUsers.map((user) => (
              <div
                key={user.sigla}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-sm sm:text-base leading-tight">{user.nome || 'Nome não informado'}</h3>
                      <Badge variant={user.status === 'ATIVO' ? 'default' : 'secondary'}>
                        {user.status || 'ATIVO'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div>
                        <strong>Sigla:</strong> {user.sigla}
                      </div>
                      <div>
                        <strong>Cargo:</strong> {user.cargo || '-'}
                      </div>
                      <div>
                        <strong>Seção:</strong> {user.secao || '-'}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <strong>Senha:</strong> {user.senha ? '••••••••' : 'Não definida'}
                    </div>
                  </div>
                  
                  {canManageUsers && (
                    <div className="ml-4 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="h-8 text-xs"
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="sm:inline">Editar</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!loading && filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado com os filtros aplicados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditUserModal
        user={editingUser}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUserUpdated={loadUsers}
      />

      <AddUserModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onUserAdded={loadUsers}
      />
    </div>
  );
}