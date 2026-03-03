import { useState } from "react";
import { Mail, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

interface Beneficiario {
  matricula: number;
  nome: string;
  cpf: number;
  email: string | null;
}

interface EditEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  beneficiario: Beneficiario | null;
  onSuccess: () => void;
}

export function EditEmailModal({ isOpen, onClose, beneficiario, onSuccess }: EditEmailModalProps) {
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const { session } = useAuth();

  // Atualizar email quando o beneficiário mudar
  useState(() => {
    if (beneficiario) {
      setEmail(beneficiario.email || "");
      setMotivo("");
    }
  });

  const handleClose = () => {
    setEmail("");
    setMotivo("");
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!beneficiario) {
      mostrarFeedback('erro', 'Erro', 'Nenhum associado selecionado');
      return;
    }

    if (!session?.user) {
      mostrarFeedback('erro', 'Erro', 'Sessão não encontrada');
      return;
    }

    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      mostrarFeedback('erro', 'Erro', 'Email é obrigatório');
      return;
    }

    if (!validateEmail(emailTrimmed)) {
      mostrarFeedback('erro', 'Email inválido', 'Por favor, insira um email válido');
      return;
    }

    // Verificar se o email mudou
    if (emailTrimmed === beneficiario.email) {
      mostrarFeedback('info', 'Sem alterações', 'O email informado é o mesmo já cadastrado');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Atualizar email na tabela cadben
      const { error: updateError } = await supabase
        .from('cadben')
        .update({ email: emailTrimmed })
        .eq('matricula', beneficiario.matricula);

      if (updateError) {
        console.error('Erro ao atualizar email:', updateError);
        mostrarFeedback('erro', 'Erro', 'Erro ao atualizar email');
        return;
      }

      // 2. Registrar log da alteração
      const { error: logError } = await supabase
        .from('email_change_logs')
        .insert({
          matricula: beneficiario.matricula,
          cpf: beneficiario.cpf.toString().padStart(11, '0'),
          nome_associado: beneficiario.nome,
          email_anterior: beneficiario.email,
          email_novo: emailTrimmed,
          alterado_por_sigla: session.user.sigla,
          alterado_por_nome: session.user.nome,
          motivo: motivo.trim() || null
        });

      if (logError) {
        console.error('Erro ao registrar log:', logError);
        // Não falha a operação se o log falhar, mas avisa
        console.warn('Email atualizado mas log não foi registrado');
      }

      const acao = beneficiario.email ? 'atualizado' : 'cadastrado';
      mostrarToast('sucesso', `Email ${acao} com sucesso!`);

      handleClose();
      onSuccess();

    } catch (error) {
      console.error('Erro ao processar alteração:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao processar alteração de email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!beneficiario) return null;

  const isNewEmail = !beneficiario.email;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {isNewEmail ? 'Cadastrar Email' : 'Editar Email'}
          </DialogTitle>
          <DialogDescription>
            {isNewEmail
              ? 'Cadastre um email para o associado'
              : 'Altere o email cadastrado do associado'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do associado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">Associado:</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Nome:</strong> {beneficiario.nome}</p>
              <p><strong>Matrícula:</strong> {beneficiario.matricula}</p>
              <p>
                <strong>CPF:</strong> {beneficiario.cpf.toString().padStart(11, '0').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </p>
              {beneficiario.email && (
                <p><strong>Email atual:</strong> {beneficiario.email}</p>
              )}
            </div>
          </div>

          {/* Campo de email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {isNewEmail ? 'Novo Email' : 'Email'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Campo de motivo (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da {isNewEmail ? 'Cadastro' : 'Alteração'} (opcional)
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Solicitação do associado, correção de dados, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isLoading}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length}/500 caracteres
            </p>
          </div>

          {/* Aviso sobre log */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>ℹ️ Registro de auditoria:</strong> Esta alteração será registrada no sistema para fins de auditoria.
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isNewEmail ? 'Cadastrar' : 'Salvar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
