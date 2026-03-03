import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPABASE_CONFIG } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TokenData {
  nome: string;
  cpf: number;
  matricula: number;
  hasPassword?: boolean;
}

export default function ResetPassword() {
  const { token: paramToken } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { mostrarFeedback } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectSeconds, setRedirectSeconds] = useState(5);

  const token = (() => {
    const queryParams = new URLSearchParams(location.search);
    const queryToken = queryParams.get('token');
    if (paramToken) return paramToken;
    if (queryToken) return queryToken;

    if (location.hash && location.hash.includes('/redefinir-senha/')) {
      const hashToken = location.hash.split('/redefinir-senha/')[1]?.split('?')[0];
      if (hashToken) return hashToken;
    }

    return '';
  })();

  useEffect(() => {
    validateToken();
  }, [paramToken, location.search, location.hash]);

  useEffect(() => {
    if (!isCompleted) return;

    if (redirectSeconds <= 0) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isCompleted, redirectSeconds, navigate]);

  const validateToken = async () => {
    if (!token) {
      setErrorMessage("Token não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${SUPABASE_CONFIG.url}/functions/v1/reset-password/validate?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'apikey': SUPABASE_CONFIG.key,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error || 'Token inválido');
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setTokenData(result.data);
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setErrorMessage('Erro ao validar token. Tente novamente.');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      mostrarFeedback('erro', 'Erro', 'As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      mostrarFeedback('erro', 'Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setValidating(true);

      const response = await fetch(
        `${SUPABASE_CONFIG.url}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
            'apikey': SUPABASE_CONFIG.key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            newPassword
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        mostrarFeedback('erro', 'Erro', result.error || 'Erro ao redefinir senha');
        return;
      }

      const mensagem = tokenData?.hasPassword
        ? 'Senha redefinida com sucesso! Você já pode fazer login.'
        : 'Senha cadastrada com sucesso! Você já pode fazer login.';

      mostrarFeedback('sucesso', 'Sucesso!', mensagem);
      setSuccessMessage(mensagem);
      setRedirectSeconds(5);
      setIsCompleted(true);

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  const formatCPF = (cpf: number) => {
    const cpfStr = String(cpf).padStart(11, '0');
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Link Inválido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {tokenData?.hasPassword ? 'Redefinir Senha' : 'Cadastrar Senha'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {tokenData?.hasPassword
              ? 'Crie uma nova senha para sua conta'
              : 'Cadastre sua senha para acessar o sistema FUNSEP'
            }
          </p>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Dados da conta:</p>
            <p className="text-sm text-blue-700">
              <strong>Nome:</strong> {tokenData?.nome}
            </p>
            <p className="text-sm text-blue-700">
              <strong>CPF:</strong> {tokenData?.cpf && formatCPF(tokenData.cpf)}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Matrícula:</strong> {tokenData?.matricula}
            </p>
          </div>

          {isCompleted ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Operação concluída com sucesso</span>
                </div>
                <p className="text-sm text-green-700 mt-2">{successMessage}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Redirecionando em <strong>{redirectSeconds}</strong> segundos...
              </p>
              <Button
                type="button"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Ir para a página inicial
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    minLength={6}
                    disabled={validating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente sua nova senha"
                    required
                    minLength={6}
                    disabled={validating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className={`text-sm flex items-center gap-2 ${
                  newPassword === confirmPassword ? 'text-green-600' : 'text-destructive'
                }`}>
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>As senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>As senhas não coincidem</span>
                    </>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={validating || newPassword !== confirmPassword || newPassword.length < 6}
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tokenData?.hasPassword ? 'Redefinindo...' : 'Cadastrando...'}
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {tokenData?.hasPassword ? 'Redefinir Senha' : 'Cadastrar Senha'}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
