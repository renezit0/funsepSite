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

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserModal({ open, onOpenChange, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    sigla: "",
    nome: "",
    cargo: "",
    secao: "",
    senha: "",
    cpf: "",
  });
  const [loading, setLoading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sigla || !formData.nome || !formData.senha) {
      mostrarFeedback('erro', 'Erro', 'Sigla, nome e senha são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('usuarios')
        .insert({
          sigla: formData.sigla.toUpperCase(),
          nome: formData.nome,
          cargo: formData.cargo || null,
          secao: formData.secao || null,
          senha: formData.senha,
          cpf: formData.cpf || null,
          status: 'ATIVO'
        });

      if (error) {
        if (error.code === '23505') {
          mostrarFeedback('erro', 'Erro', 'Já existe um usuário com esta sigla');
        } else {
          throw error;
        }
        return;
      }

      mostrarToast('sucesso', 'Usuário cadastrado com sucesso!');
      setFormData({
        sigla: "",
        nome: "",
        cargo: "",
        secao: "",
        senha: "",
        cpf: "",
      });
      onUserAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo usuário do sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla *</Label>
            <Input
              id="sigla"
              value={formData.sigla}
              onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
              placeholder="Ex: JOS"
              required
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome completo do usuário"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
              placeholder="Somente números"
              maxLength={11}
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
              placeholder="Ex: FUNSEP, TI, Administrativo"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Senha para acesso ao sistema"
              required
              maxLength={50}
            />
          </div>

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
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}