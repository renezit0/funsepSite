import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  sigla: string;
  nome: string;
  cargo: string;
  secao: string;
  senha: string;
  status: string;
}

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export function EditUserModal({ user, open, onOpenChange, onUserUpdated }: EditUserModalProps) {
  const { session } = useAuth();
  const [formData, setFormData] = useState<User>(user || {
    sigla: "",
    nome: "",
    cargo: "",
    secao: "",
    senha: "",
    status: "ATIVO"
  });
  const [loading, setLoading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();
  
  const isDeveloper = session?.user?.cargo === 'DESENVOLVEDOR';
  const canManageUsers = session?.user?.cargo && 
    ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'].includes(session.user.cargo);

  React.useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        nome: formData.nome,
        cargo: formData.cargo,
        secao: formData.secao,
        status: formData.status,
      };

      // Apenas desenvolvedores podem alterar a sigla
      if (isDeveloper && formData.sigla !== user?.sigla) {
        updateData.sigla = formData.sigla.toUpperCase();
      }

      // Só atualizar senha se foi alterada
      if (formData.senha && formData.senha !== user?.senha) {
        updateData.senha = formData.senha;
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('sigla', user?.sigla || formData.sigla);

      if (error) throw error;

      mostrarToast('sucesso', 'Usuário atualizado com sucesso!');
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere as informações do usuário {user.nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla</Label>
            <Input
              id="sigla"
              value={formData.sigla}
              onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
              disabled={!isDeveloper}
              className={!isDeveloper ? "bg-muted" : ""}
              maxLength={10}
            />
            {isDeveloper && (
              <p className="text-xs text-muted-foreground">
                Apenas desenvolvedores podem alterar a sigla
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Select
              value={formData.cargo || undefined}
              onValueChange={(value) => setFormData({ ...formData, cargo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GERENTE">Gerente</SelectItem>
                <SelectItem value="DESENVOLVEDOR">Desenvolvedor</SelectItem>
                <SelectItem value="ANALISTA DE SISTEMAS">Analista de Sistemas</SelectItem>
                <SelectItem value="ATENDENTE">Atendente</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secao">Seção</Label>
            <Input
              id="secao"
              value={formData.secao}
              onChange={(e) => setFormData({ ...formData, secao: e.target.value })}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha (deixe em branco para não alterar)</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="••••••••"
              maxLength={50}
            />
          </div>

          {canManageUsers && (
            <div className="space-y-2">
              <Label htmlFor="status">Status do Usuário</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}