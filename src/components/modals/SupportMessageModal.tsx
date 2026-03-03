import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";

interface SupportMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: "LOGIN_MODAL" | "CONTACT_PAGE";
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SupportMessageModal({
  isOpen,
  onClose,
  source = "LOGIN_MODAL",
}: SupportMessageModalProps) {
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [matriculaDesconhecida, setMatriculaDesconhecida] = useState(false);
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { mostrarFeedback } = useFeedback();

  const resetForm = () => {
    setNome("");
    setMatricula("");
    setMatriculaDesconhecida(false);
    setEmail("");
    setCpf("");
    setDataNascimento("");
    setTelefone("");
    setMensagem("");
  };

  const normalizeCpf = (value: string) => value.replace(/\D/g, "").slice(0, 11);
  const formatCpf = (value: string) => {
    const digits = normalizeCpf(value);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, p1, p2, p3, p4) =>
      p4 ? `${p1}.${p2}.${p3}-${p4}` : `${p1}.${p2}.${p3}`
    );
  };

  const normalizeTelefone = (value: string) => value.replace(/\D/g, "").slice(0, 11);
  const formatTelefone = (value: string) => {
    const digits = normalizeTelefone(value);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, p1, p2) =>
        p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`
      );
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, p1, p2) =>
      p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cpfLimpo = normalizeCpf(cpf);
    const telefoneLimpo = normalizeTelefone(telefone);
    const matriculaLimpa = matricula.replace(/\D/g, "");

    if (!nome.trim()) {
      mostrarFeedback("erro", "Erro", "Informe seu nome.");
      return;
    }

    if (!matriculaDesconhecida && !matriculaLimpa) {
      mostrarFeedback("erro", "Erro", "Informe sua matrícula ou marque que não possui.");
      return;
    }

    if (!emailRegex.test(email.trim())) {
      mostrarFeedback("erro", "Erro", "Informe um e-mail válido.");
      return;
    }

    if (cpfLimpo.length !== 11) {
      mostrarFeedback("erro", "Erro", "CPF deve ter 11 dígitos.");
      return;
    }

    if (!dataNascimento) {
      mostrarFeedback("erro", "Erro", "Informe sua data de nascimento.");
      return;
    }

    if (telefoneLimpo.length < 10) {
      mostrarFeedback("erro", "Erro", "Informe um telefone válido com DDD.");
      return;
    }

    if (!mensagem.trim()) {
      mostrarFeedback("erro", "Erro", "Explique brevemente seu problema.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-support-message", {
        body: {
          nome: nome.trim(),
          matricula: matriculaDesconhecida ? null : Number(matriculaLimpa),
          matriculaDesconhecida: matriculaDesconhecida,
          email: email.trim().toLowerCase(),
          cpf: cpfLimpo,
          dataNascimento,
          telefone: telefoneLimpo,
          mensagem: mensagem.trim(),
          origem: source,
        },
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || "Falha ao enviar mensagem");
      }

      mostrarFeedback(
        "sucesso",
        "Mensagem enviada",
        "Recebemos seus dados e entraremos em contato para resolver seu problema."
      );
      resetForm();
      onClose();
    } catch (error) {
      console.error("Erro ao enviar mensagem de suporte:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível enviar sua mensagem. Tente novamente.";
      mostrarFeedback("erro", "Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar mensagem
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para que nossa equipe entre em contato.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-nome">Nome *</Label>
            <Input
              id="support-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-matricula">Matrícula *</Label>
            <Input
              id="support-matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              disabled={isLoading || matriculaDesconhecida}
              placeholder="Digite sua matrícula"
              required={!matriculaDesconhecida}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="support-sem-matricula"
                checked={matriculaDesconhecida}
                onCheckedChange={(checked) => {
                  const isChecked = checked as boolean;
                  setMatriculaDesconhecida(isChecked);
                  if (isChecked) setMatricula("");
                }}
              />
              <Label htmlFor="support-sem-matricula" className="text-sm cursor-pointer">
                Desconhecido / Não possui matrícula
              </Label>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support-email">E-mail *</Label>
              <Input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-cpf">CPF *</Label>
              <Input
                id="support-cpf"
                value={formatCpf(cpf)}
                onChange={(e) => setCpf(e.target.value)}
                maxLength={14}
                placeholder="000.000.000-00"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support-data-nascimento">Data de nascimento *</Label>
              <Input
                id="support-data-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-telefone">Telefone *</Label>
              <Input
                id="support-telefone"
                value={formatTelefone(telefone)}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(41) 99999-9999"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support-mensagem">Mensagem *</Label>
            <Textarea
              id="support-mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Explique brevemente seu problema para que possamos entrar em contato para resolver."
              rows={4}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Enviar mensagem
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
