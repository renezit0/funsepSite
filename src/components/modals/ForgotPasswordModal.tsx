import { useState } from "react";
import { Mail, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SUPABASE_CONFIG } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [cpfOrEmail, setCpfOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_CONFIG.url}/functions/v1/request-password-reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'apikey': SUPABASE_CONFIG.key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cpfOrEmail: cpfOrEmail.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        mostrarFeedback('erro', 'Erro', result.error || 'Erro ao enviar link de redefinição');
        return;
      }

      mostrarFeedback(
        'sucesso',
        'Email Enviado!',
        'Se o CPF/email estiver cadastrado, você receberá um link para redefinir sua senha.'
      );

      setCpfOrEmail("");
      onClose();
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao enviar link. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    // Se contém @ é email, não formata
    if (value.includes('@')) return value;

    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold text-center">
            Esqueceu sua senha?
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Digite seu CPF ou email para receber um link de redefinição
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpfOrEmail">CPF ou Email *</Label>
            <Input
              id="cpfOrEmail"
              type="text"
              placeholder="000.000.000-00 ou seu@email.com"
              value={cpfOrEmail.includes('@') ? cpfOrEmail : formatCPF(cpfOrEmail)}
              onChange={(e) => setCpfOrEmail(e.target.value)}
              maxLength={cpfOrEmail.includes('@') ? undefined : 14}
              required
              disabled={isLoading}
            />
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Como funciona?</p>
                  <ul className="text-xs text-blue-700 space-y-1 mt-2 list-disc list-inside">
                    <li>Você receberá um email com um link seguro</li>
                    <li>O link é válido por 24 horas</li>
                    <li>Ao clicar, você poderá criar uma nova senha</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar Link
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
