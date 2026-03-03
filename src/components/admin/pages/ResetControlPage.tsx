import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordResetTokenLog {
  id: string;
  cpf_or_email: string;
  matricula: number | null;
  used: boolean;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  created_by_sigla: string | null;
  cadben?: {
    nome?: string;
    cpf?: number;
  } | null;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function ResetControlPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<PasswordResetTokenLog[]>([]);
  const { mostrarFeedback } = useFeedback();
  const { session } = useAuth();

  const isDeveloper = session?.user?.cargo === "DESENVOLVEDOR";

  const getStatus = (log: PasswordResetTokenLog) => {
    if (log.used) {
      return { label: "USADO", variant: "default" as const };
    }

    const isExpired = new Date(log.expires_at).getTime() < Date.now();
    if (isExpired) {
      return { label: "EXPIRADO", variant: "destructive" as const };
    }

    return { label: "ATIVO", variant: "secondary" as const };
  };

  const loadLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("password_reset_tokens")
        .select("id, cpf_or_email, matricula, used, expires_at, created_at, used_at, created_by_sigla, cadben(nome, cpf)")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;
      setLogs((data || []) as unknown as PasswordResetTokenLog[]);
    } catch (error) {
      console.error("Erro ao carregar histórico de redefinições:", error);
      mostrarFeedback("erro", "Erro", "Erro ao carregar histórico de redefinições");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDeveloper) return;
    void loadLogs();
  }, [isDeveloper]);

  if (!isDeveloper) {
    return (
      <div className="text-sm text-muted-foreground">
        Acesso restrito aos desenvolvedores.
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;

    const search = normalizeText(searchTerm);
    const nome = normalizeText(log.cadben?.nome || "");
    const cpf = String(log.cadben?.cpf || "");
    const matricula = String(log.matricula || "");
    const email = normalizeText(log.cpf_or_email || "");
    const criador = normalizeText(log.created_by_sigla || "");
    const status = normalizeText(getStatus(log).label);

    return (
      nome.includes(search) ||
      cpf.includes(searchTerm.replace(/\D/g, "")) ||
      matricula.includes(searchTerm.trim()) ||
      email.includes(search) ||
      criador.includes(search) ||
      status.includes(search)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
          Controle Redefinições
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Acompanhamento de links de cadastro/redefinição de senha enviados.
        </p>
      </div>

      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Histórico de Tokens (últimos 300)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, matrícula, status ou sigla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Carregando histórico...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum registro encontrado.</div>
            ) : (
              filteredLogs.map((log) => {
                const status = getStatus(log);
                return (
                  <div key={log.id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="font-medium text-sm sm:text-base">
                        {log.cadben?.nome || "Associado não identificado"}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div><strong>Matrícula:</strong> {log.matricula || "-"}</div>
                      <div><strong>Destino:</strong> {log.cpf_or_email}</div>
                      <div><strong>Criado por:</strong> {log.created_by_sigla || "AUTO"}</div>
                      <div><strong>Criado em:</strong> {new Date(log.created_at).toLocaleString("pt-BR")}</div>
                      <div><strong>Expira em:</strong> {new Date(log.expires_at).toLocaleString("pt-BR")}</div>
                      <div><strong>Usado em:</strong> {log.used_at ? new Date(log.used_at).toLocaleString("pt-BR") : "-"}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
