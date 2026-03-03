import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, LogIn, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { adminAuth } from "@/services/adminAuth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { SupportMessageModal } from "./SupportMessageModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onSuccess
}: LoginModalProps) {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const { login, session } = useAuth();
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      const result = await login(cleanCpf, password);
      if (result.success) {
        setCpf("");
        setPassword("");
        
        mostrarToast('sucesso', 'Bem-vindo ao sistema!');
        
        onClose();
        onSuccess?.();
        
        setTimeout(() => {
          const currentSession = adminAuth.getSession();
          const adminRoles = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'];
          
          if (currentSession?.user?.cargo && adminRoles.includes(currentSession.user.cargo)) {
            navigate('/admin');
          }
        }, 200);
      } else {
        mostrarFeedback('erro', 'Erro no login', result.error || 'CPF ou senha inválidos');
      }
    } catch (error) {
      mostrarFeedback('erro', 'Erro', 'Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-base sm:text-lg font-semibold text-center">
            Área do Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} maxLength={14} required disabled={isLoading} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={checked => setRemember(checked as boolean)} />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Lembrar-me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setShowForgotPassword(true);
              }}
              className="text-sm text-primary hover:underline"
            >
              Cadastrar ou recuperar senha
            </button>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            <LogIn className="h-4 w-4" />
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {/* Login Information Card */}
          <Card className="bg-bg-secondary">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Info className="h-4 w-4 text-info" />
                Como Acessar
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  
                  
                </div>
                
                <div>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <i className="fas fa-user" aria-hidden="true"></i>
                    Associados FUNSEP:
                  </p>
                  <p className="text-muted-foreground">
                    Use seu CPF + senha cadastrada no sistema
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Caso não receba o e-mail, entre em contato conosco.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              setShowSupportMessage(true);
            }}
            disabled={isLoading}
          >
            Enviar mensagem
          </Button>
        </form>
      </DialogContent>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
      <SupportMessageModal
        isOpen={showSupportMessage}
        onClose={() => setShowSupportMessage(false)}
        source="LOGIN_MODAL"
      />
    </Dialog>;
}
