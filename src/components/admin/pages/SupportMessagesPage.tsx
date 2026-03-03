import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Clock, Eye, CheckCircle2, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminAuth } from "@/services/adminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFeedback } from "@/contexts/FeedbackContext";

interface SupportMessage {
  id: string;
  nome: string;
  matricula: number | null;
  matricula_desconhecida: boolean;
  email: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  mensagem: string;
  origem: string;
  status: string;
  feedback_interno: string | null;
  respondido_por_sigla: string | null;
  respondido_por_cargo: string | null;
  respondido_em: string | null;
  created_at: string;
  updated_at: string;
  created_by_sigla: string | null;
  target_sigla: string | null;
  target_matricula: number | null;
  target_type: string;
  awaiting_party: string | null;
  last_sender_tipo: string | null;
  last_sender_sigla: string | null;
  last_interaction_at: string | null;
}

interface SupportReply {
  id: string;
  support_message_id: string;
  sender_tipo: "ASSOCIADO" | "EQUIPE";
  sender_nome: string | null;
  sender_sigla: string | null;
  mensagem: string;
  created_at: string;
}

interface TeamUser {
  sigla: string;
  nome: string;
  cargo: string | null;
  cpf: string | null;
  status: string | null;
}

interface AssociateCandidate {
  matricula: number;
  nome: string | null;
  cpf: number | null;
  email: string | null;
  dtnasc: string | null;
  telefone: string | null;
  telefone1: string | null;
}

const allowedRoles = ["GERENTE", "ANALISTA DE SISTEMAS", "DESENVOLVEDOR"];
const normalizeStatus = (status: string) => (status === "RESPONDIDO" ? "ATENDIDO" : status);
const isFeedbackOnlyOccurrence = (origem: string) => origem === "LOGIN_MODAL" || origem === "CONTACT_PAGE";
const isChatOccurrence = (origem: string) =>
  origem === "ASSOCIADO_PORTAL" || origem === "ADMIN_ASSOCIADO" || origem === "ADMIN_INTERNO";
const isOpenStatus = (status: string) => status === "PENDENTE" || status === "EM_ANALISE";

type StatusFilter = "ABERTAS" | "TODOS" | "PENDENTE" | "EM_ANALISE" | "ATENDIDO";

export function SupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ABERTAS");
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [feedbackInterno, setFeedbackInterno] = useState("");
  const [respostaChat, setRespostaChat] = useState("");
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const conversationRef = useRef<HTMLDivElement | null>(null);

  const [newOccurrenceOpen, setNewOccurrenceOpen] = useState(false);
  const [newOccurrenceTargetType, setNewOccurrenceTargetType] = useState<"INTERNO" | "ASSOCIADO">("INTERNO");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedTeamSigla, setSelectedTeamSigla] = useState("");
  const [associateSearchInput, setAssociateSearchInput] = useState("");
  const [associateCandidate, setAssociateCandidate] = useState<AssociateCandidate | null>(null);
  const [newOccurrenceMessage, setNewOccurrenceMessage] = useState("");
  const [isCreatingOccurrence, setIsCreatingOccurrence] = useState(false);

  const session = adminAuth.getSession();
  const currentSigla = session?.user?.sigla || "";
  const { mostrarFeedback } = useFeedback();

  const canSeeMessage = (message: SupportMessage) => {
    if (!currentSigla) return false;

    if (message.origem === "ADMIN_INTERNO") {
      return message.created_by_sigla === currentSigla || message.target_sigla === currentSigla;
    }

    if (message.origem === "ADMIN_ASSOCIADO") {
      return message.created_by_sigla === currentSigla;
    }

    return true;
  };

  const isActionRequiredForCurrentUser = (message: SupportMessage) => {
    if (!currentSigla || !isOpenStatus(message.status)) return false;

    if (message.origem === "ADMIN_INTERNO") {
      if (message.awaiting_party === "DESTINATARIO_INTERNO") {
        return message.target_sigla === currentSigla;
      }
      if (message.awaiting_party === "REMETENTE_INTERNO") {
        return message.created_by_sigla === currentSigla;
      }
      // Fallback para registros antigos sem awaiting_party
      return message.target_sigla === currentSigla;
    }

    if (message.origem === "ADMIN_ASSOCIADO") {
      return message.created_by_sigla === currentSigla && message.awaiting_party === "EQUIPE";
    }

    return message.awaiting_party === "EQUIPE" || !message.awaiting_party;
  };

  useEffect(() => {
    loadMessages();
    loadTeamUsers();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((item) => ({ ...item, status: normalizeStatus(item.status) })) as SupportMessage[];
      setMessages(normalized.filter(canSeeMessage));
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error);
      mostrarFeedback("erro", "Erro", "Não foi possível carregar as ocorrências.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamUsers = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("sigla, nome, cargo, cpf, status")
      .eq("status", "ATIVO")
      .not("cpf", "is", null)
      .not("cpf", "eq", "")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar usuários da equipe:", error);
      return;
    }

    const users = ((data || []) as TeamUser[])
      .filter((user) => Boolean(user.sigla && user.sigla.trim()))
      .filter((user) => user.sigla !== currentSigla);
    setTeamUsers(users);
    if (users.length > 0) {
      setSelectedTeamSigla((prev) => prev || users[0].sigla);
    }
  };

  const filteredMessages = useMemo(() => {
    if (statusFilter === "TODOS") return messages;
    if (statusFilter === "ABERTAS") {
      return messages.filter((item) => item.status === "PENDENTE" || item.status === "EM_ANALISE");
    }
    return messages.filter((item) => item.status === statusFilter);
  }, [messages, statusFilter]);

  const groupedMessages = useMemo(() => {
    const byStatus: Record<string, SupportMessage[]> = {
      PENDENTE: [],
      EM_ANALISE: [],
      ATENDIDO: [],
    };

    for (const item of filteredMessages) {
      const key = normalizeStatus(item.status);
      if (!byStatus[key]) byStatus[key] = [];
      byStatus[key].push(item);
    }

    if (statusFilter === "PENDENTE") return [{ key: "PENDENTE", label: "Pendentes", items: byStatus.PENDENTE }];
    if (statusFilter === "EM_ANALISE") return [{ key: "EM_ANALISE", label: "Em análise", items: byStatus.EM_ANALISE }];
    if (statusFilter === "ATENDIDO") return [{ key: "ATENDIDO", label: "Atendidas", items: byStatus.ATENDIDO }];
    if (statusFilter === "ABERTAS") {
      return [
        { key: "PENDENTE", label: "Pendentes", items: byStatus.PENDENTE },
        { key: "EM_ANALISE", label: "Em análise", items: byStatus.EM_ANALISE },
      ];
    }

    return [
      { key: "PENDENTE", label: "Pendentes", items: byStatus.PENDENTE },
      { key: "EM_ANALISE", label: "Em análise", items: byStatus.EM_ANALISE },
      { key: "ATENDIDO", label: "Atendidas", items: byStatus.ATENDIDO },
    ];
  }, [filteredMessages, statusFilter]);

  const loadReplies = async (messageId: string) => {
    const { data, error } = await supabase
      .from("support_message_replies")
      .select("*")
      .eq("support_message_id", messageId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar respostas:", error);
      setReplies([]);
      return;
    }

    setReplies((data || []) as SupportReply[]);
  };

  const handleOpenMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setNewStatus(message.status);
    setFeedbackInterno(message.feedback_interno || "");
    setRespostaChat("");

    if (isChatOccurrence(message.origem)) {
      loadReplies(message.id);
    } else {
      setReplies([]);
    }
  };

  useEffect(() => {
    if (!selectedMessage || !isChatOccurrence(selectedMessage.origem)) return;
    const timer = window.setTimeout(() => {
      if (conversationRef.current) {
        conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedMessage?.id, replies.length]);

  const handleSave = async () => {
    if (!selectedMessage || !newStatus || !session) return;

    if (!allowedRoles.includes(session.user.cargo)) {
      mostrarFeedback("erro", "Acesso negado", "Você não possui permissão para atualizar ocorrências.");
      return;
    }

    try {
      const { data: freshMessage, error: freshError } = await supabase
        .from("support_messages")
        .select("id, status, origem, created_by_sigla, target_sigla")
        .eq("id", selectedMessage.id)
        .maybeSingle();

      if (freshError || !freshMessage) {
        mostrarFeedback("erro", "Erro", "Não foi possível validar a ocorrência atual.");
        return;
      }

      const freshStatus = normalizeStatus(freshMessage.status);
      if (freshStatus === "ATENDIDO" && respostaChat.trim()) {
        mostrarFeedback("erro", "Ocorrência atendida", "Esta ocorrência já foi atendida e não aceita nova resposta.");
        await loadMessages();
        setSelectedMessage(null);
        return;
      }

      const isAtendido = newStatus === "ATENDIDO";
      const feedbackOnly = isFeedbackOnlyOccurrence(selectedMessage.origem);
      const hasReply = isChatOccurrence(selectedMessage.origem) && Boolean(respostaChat.trim());
      const baseUpdate: Record<string, string | null> = {
        status: hasReply && !isAtendido ? "EM_ANALISE" : newStatus,
        feedback_interno: feedbackOnly ? feedbackInterno.trim() || null : null,
        respondido_por_sigla: isAtendido ? session.user.sigla : null,
        respondido_por_cargo: isAtendido ? session.user.cargo : null,
        respondido_em: isAtendido ? new Date().toISOString() : null,
        awaiting_party: isAtendido ? "NENHUM" : selectedMessage.awaiting_party,
      };

      if (hasReply) {
        if (selectedMessage.origem === "ADMIN_INTERNO") {
          const repliedByRemetente = session.user.sigla === freshMessage.created_by_sigla;
          baseUpdate.awaiting_party = repliedByRemetente ? "DESTINATARIO_INTERNO" : "REMETENTE_INTERNO";
        } else {
          baseUpdate.awaiting_party = "ASSOCIADO";
        }

        baseUpdate.last_sender_tipo = "EQUIPE";
        baseUpdate.last_sender_sigla = session.user.sigla;
        baseUpdate.last_interaction_at = new Date().toISOString();
      } else if (isAtendido) {
        baseUpdate.last_interaction_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_messages")
        .update(baseUpdate)
        .eq("id", selectedMessage.id);

      if (error) throw error;

      if (isChatOccurrence(selectedMessage.origem) && respostaChat.trim()) {
        const { error: replyError } = await supabase
          .from("support_message_replies")
          .insert({
            support_message_id: selectedMessage.id,
            sender_tipo: "EQUIPE",
            sender_nome: session.user.nome,
            sender_sigla: session.user.sigla,
            mensagem: respostaChat.trim(),
          });

        if (replyError) throw replyError;
      }

      mostrarFeedback("sucesso", "Sucesso", "Ocorrência atualizada com sucesso.");
      setSelectedMessage(null);
      setNewStatus("");
      setFeedbackInterno("");
      setRespostaChat("");
      setReplies([]);
      loadMessages();
    } catch (error) {
      console.error("Erro ao atualizar ocorrência:", error);
      mostrarFeedback("erro", "Erro", "Não foi possível salvar os dados da ocorrência.");
    }
  };

  const handleSearchAssociate = async () => {
    const digits = associateSearchInput.replace(/\D/g, "");
    if (!digits) {
      mostrarFeedback("erro", "Erro", "Informe uma matrícula ou CPF válido.");
      return;
    }

    const isCpfSearch = digits.length >= 11;
    const cpfNumber = Number.parseInt(digits.padStart(11, "0").slice(-11), 10);
    const matricula = Number.parseInt(digits, 10);

    const query = supabase
      .from("cadben")
      .select("matricula, nome, cpf, email, dtnasc, telefone, telefone1")
      .limit(1);

    const { data, error } = isCpfSearch
      ? await query.eq("cpf", cpfNumber).maybeSingle()
      : await query.eq("matricula", matricula).maybeSingle();

    if (error || !data) {
      setAssociateCandidate(null);
      mostrarFeedback("erro", "Não encontrado", "Associado não encontrado para esta matrícula/CPF.");
      return;
    }

    setAssociateCandidate(data as AssociateCandidate);
  };

  const handleCreateOccurrence = async () => {
    if (!session) return;
    if (!newOccurrenceMessage.trim()) {
      mostrarFeedback("erro", "Erro", "Escreva a descrição da ocorrência.");
      return;
    }

    setIsCreatingOccurrence(true);
    try {
      if (newOccurrenceTargetType === "INTERNO") {
        const target = teamUsers.find((item) => item.sigla === selectedTeamSigla);
        if (!target) {
          mostrarFeedback("erro", "Erro", "Selecione um usuário da equipe.");
          return;
        }

        const { error } = await supabase.from("support_messages").insert({
          nome: target.nome,
          matricula: null,
          matricula_desconhecida: true,
          email: `${target.sigla.toLowerCase()}@interno.funsep`,
          cpf: "00000000000",
          data_nascimento: "1900-01-01",
          telefone: "0000000000",
          mensagem: newOccurrenceMessage.trim(),
          origem: "ADMIN_INTERNO",
          status: "PENDENTE",
          feedback_interno: null,
          created_by_sigla: session.user.sigla,
          target_sigla: target.sigla,
          target_matricula: null,
          target_type: "INTERNO",
          awaiting_party: "DESTINATARIO_INTERNO",
          last_sender_tipo: "EQUIPE",
          last_sender_sigla: session.user.sigla,
          last_interaction_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        if (!associateCandidate) {
          mostrarFeedback("erro", "Erro", "Busque um associado por matrícula antes de enviar.");
          return;
        }

        const cpfDigits = String(associateCandidate.cpf || "").replace(/\D/g, "").padStart(11, "0").slice(-11);
        const nascimento = String(associateCandidate.dtnasc || "").slice(0, 10) || "1900-01-01";
        const telefone = String(associateCandidate.telefone || associateCandidate.telefone1 || "").replace(/\D/g, "") || "0000000000";
        const email = (associateCandidate.email || `${associateCandidate.matricula}@associado.funsep`).toLowerCase();

        const { error } = await supabase.from("support_messages").insert({
          nome: associateCandidate.nome || `Associado ${associateCandidate.matricula}`,
          matricula: associateCandidate.matricula,
          matricula_desconhecida: false,
          email,
          cpf: cpfDigits,
          data_nascimento: nascimento,
          telefone,
          mensagem: newOccurrenceMessage.trim(),
          origem: "ADMIN_ASSOCIADO",
          status: "PENDENTE",
          feedback_interno: null,
          created_by_sigla: session.user.sigla,
          target_sigla: null,
          target_matricula: associateCandidate.matricula,
          target_type: "ASSOCIADO",
          awaiting_party: "ASSOCIADO",
          last_sender_tipo: "EQUIPE",
          last_sender_sigla: session.user.sigla,
          last_interaction_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      mostrarFeedback("sucesso", "Ocorrência criada", "Ocorrência registrada com sucesso.");
      setNewOccurrenceOpen(false);
      setNewOccurrenceMessage("");
      setAssociateCandidate(null);
      setAssociateSearchInput("");
      loadMessages();
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      mostrarFeedback("erro", "Erro", "Não foi possível criar a ocorrência.");
    } finally {
      setIsCreatingOccurrence(false);
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length !== 11) return value;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return value;
  };

  const getStatusBadge = (status: string) => {
    if (status === "EM_ANALISE") {
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Eye className="h-3 w-3 mr-1" />
          Em análise
        </Badge>
      );
    }

    if (status === "ATENDIDO" || status === "RESPONDIDO") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Atendido
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const renderInitialBubble = (message: SupportMessage) => {
    if (message.origem === "ASSOCIADO_PORTAL") {
      return {
        isOwn: false,
        label: `Associado • ${new Date(message.created_at).toLocaleString("pt-BR")}`,
      };
    }

    const own = message.created_by_sigla === currentSigla;
    const roleLabel = message.origem === "ADMIN_INTERNO" ? (own ? "Remetente" : "Destinatário") : "Equipe";
    return {
      isOwn: own,
      label: `${own ? "Você" : `Equipe (${message.created_by_sigla || "FUNSEP"})`} (${roleLabel}) • ${new Date(message.created_at).toLocaleString("pt-BR")}`,
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
            Ocorrências Sistema
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestão de ocorrências públicas, entre equipe e direcionadas a associados.
          </p>
        </div>

        <Button className="gap-2 sm:self-start" onClick={() => setNewOccurrenceOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova ocorrência
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Label className="text-sm">Filtrar por status:</Label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ABERTAS">Pendentes + Em análise</SelectItem>
            <SelectItem value="PENDENTE">Somente pendentes</SelectItem>
            <SelectItem value="EM_ANALISE">Somente em análise</SelectItem>
            <SelectItem value="ATENDIDO">Somente atendidas</SelectItem>
            <SelectItem value="TODOS">Todas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs sm:text-sm text-muted-foreground">
          ({filteredMessages.length} {filteredMessages.length === 1 ? "ocorrência" : "ocorrências"})
        </span>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">Carregando ocorrências...</CardContent>
          </Card>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Nenhuma ocorrência encontrada para o filtro selecionado.
            </CardContent>
          </Card>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {group.label} ({group.items.length})
              </h2>

              {group.items.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">Nenhuma ocorrência neste grupo.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {group.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-semibold">{item.nome || "Sem identificação"}</p>
                            <p className="text-xs text-muted-foreground">
                              {(item.email || "Sem e-mail")} • {formatPhone(item.telefone || "-")}
                            </p>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <p><span className="font-medium">Matrícula:</span> {item.matricula_desconhecida ? "Desconhecido / Não possui" : item.matricula || "-"}</p>
                          <p><span className="font-medium">CPF:</span> {formatCpf(item.cpf || "-")}</p>
                          <p>
                            <span className="font-medium">Origem:</span>{" "}
                            {item.origem === "CONTACT_PAGE"
                              ? "Localização e Contato"
                              : item.origem === "ASSOCIADO_PORTAL"
                                ? "Portal do Associado"
                                : item.origem === "ADMIN_INTERNO"
                                  ? "Ocorrência Interna"
                                  : item.origem === "ADMIN_ASSOCIADO"
                                    ? "Equipe para Associado"
                                    : "Modal de Login"}
                          </p>
                          <p><span className="font-medium">Criado por:</span> {item.created_by_sigla || "Sistema"}</p>
                          <p>
                            <span className="font-medium">Aguardando:</span>{" "}
                            {item.awaiting_party === "DESTINATARIO_INTERNO"
                              ? "Destinatário interno"
                              : item.awaiting_party === "REMETENTE_INTERNO"
                                ? "Remetente interno"
                                : item.awaiting_party === "ASSOCIADO"
                                  ? "Associado"
                                  : item.awaiting_party === "NENHUM"
                                    ? "Ninguém (finalizado)"
                                    : "Equipe"}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{item.mensagem}</p>
                        {normalizeStatus(item.status) === "ATENDIDO" && item.respondido_em && (
                          <p className="text-xs text-muted-foreground">
                            Atendido por {item.respondido_por_sigla || "—"} em {new Date(item.respondido_em).toLocaleString("pt-BR")}
                          </p>
                        )}

                        <div className="flex justify-end">
                          {isActionRequiredForCurrentUser(item) && (
                            <Badge className="mr-2 bg-destructive text-destructive-foreground hover:bg-destructive">
                              Ação pendente para você
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleOpenMessage(item)}>
                            Ver detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={newOccurrenceOpen} onOpenChange={setNewOccurrenceOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ocorrência do sistema</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destino</Label>
              <select
                value={newOccurrenceTargetType}
                onChange={(e) => setNewOccurrenceTargetType(e.target.value as "INTERNO" | "ASSOCIADO")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="INTERNO">Usuário do sistema</option>
                <option value="ASSOCIADO">Associado (por matrícula)</option>
              </select>
            </div>

            {newOccurrenceTargetType === "INTERNO" ? (
              <div className="space-y-2">
                <Label>Usuário destinatário</Label>
                <select
                  value={selectedTeamSigla}
                  onChange={(e) => setSelectedTeamSigla(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {teamUsers.map((user) => (
                    <option key={user.sigla} value={user.sigla}>
                      {user.nome} ({user.cargo || "Sem cargo"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Matrícula ou CPF do associado</Label>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchAssociate();
                  }}
                >
                  <Input
                    value={associateSearchInput}
                    onChange={(e) => setAssociateSearchInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Digite a matrícula ou CPF"
                  />
                  <Button type="submit" variant="outline" className="gap-2">
                    <Search className="h-4 w-4" />
                    Buscar
                  </Button>
                </form>
                {associateCandidate && (
                  <div className="text-sm rounded-md border bg-muted/40 p-3">
                    <p className="font-medium">{associateCandidate.nome || "Associado"}</p>
                    <p className="text-muted-foreground">Matrícula: {associateCandidate.matricula}</p>
                    <p className="text-muted-foreground">Email: {associateCandidate.email || "Não informado"}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição da ocorrência</Label>
              <Textarea
                rows={5}
                value={newOccurrenceMessage}
                onChange={(e) => setNewOccurrenceMessage(e.target.value)}
                placeholder="Descreva a ocorrência."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewOccurrenceOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOccurrence} disabled={isCreatingOccurrence}>
                Criar ocorrência
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da ocorrência</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <p><span className="font-medium">Nome:</span> {selectedMessage.nome}</p>
                <p><span className="font-medium">Email:</span> {selectedMessage.email}</p>
                <p><span className="font-medium">Telefone:</span> {formatPhone(selectedMessage.telefone)}</p>
                <p><span className="font-medium">CPF:</span> {formatCpf(selectedMessage.cpf)}</p>
                <p><span className="font-medium">Matrícula:</span> {selectedMessage.matricula_desconhecida ? "Desconhecido / Não possui" : selectedMessage.matricula || "-"}</p>
                <p><span className="font-medium">Origem:</span> {selectedMessage.origem}</p>
              </div>

              {isChatOccurrence(selectedMessage.origem) ? (
                <div className="space-y-2">
                  <Label>Conversa</Label>
                  <div ref={conversationRef} className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(() => {
                      const initial = renderInitialBubble(selectedMessage);
                      return (
                        <div className={`flex ${initial.isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${initial.isOwn ? "bg-primary text-primary-foreground" : "bg-muted border"}`}>
                            <p className={`text-[11px] mb-1 ${initial.isOwn ? "text-right opacity-90" : "text-muted-foreground"}`}>
                              {initial.label}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{selectedMessage.mensagem}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {replies.map((reply) => {
                      const isOwn = reply.sender_tipo === "EQUIPE" && reply.sender_sigla === currentSigla;
                      const isTeam = reply.sender_tipo === "EQUIPE";
                      const internalRole =
                        selectedMessage.origem === "ADMIN_INTERNO" && isTeam
                          ? reply.sender_sigla === selectedMessage.created_by_sigla
                            ? "Remetente"
                            : "Destinatário"
                          : null;
                      return (
                        <div key={reply.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted border"}`}>
                            <p className={`text-[11px] mb-1 ${isOwn ? "text-right opacity-90" : "text-muted-foreground"}`}>
                              {isTeam
                                ? `Equipe (${reply.sender_sigla || "FUNSEP"})${internalRole ? ` - ${internalRole}` : ""}`
                                : "Associado"}{" "}
                              • {new Date(reply.created_at).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{reply.mensagem}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Mensagem enviada</Label>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    {selectedMessage.mensagem}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="support-status">Status</Label>
                <select
                  id="support-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="ATENDIDO">Atendido</option>
                </select>
              </div>

              {isFeedbackOnlyOccurrence(selectedMessage.origem) ? (
                <div className="space-y-2">
                  <Label>Feedback interno</Label>
                  <Textarea
                    rows={5}
                    value={feedbackInterno}
                    onChange={(e) => setFeedbackInterno(e.target.value)}
                    placeholder="Registre o andamento e retorno interno deste caso."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Resposta</Label>
                  <Textarea
                    rows={4}
                    value={respostaChat}
                    onChange={(e) => setRespostaChat(e.target.value)}
                    placeholder="Digite aqui sua resposta."
                  />
                </div>
              )}

              {normalizeStatus(newStatus) === "ATENDIDO" && selectedMessage.respondido_em && (
                <p className="text-xs text-muted-foreground">
                  Atendido por {selectedMessage.respondido_por_sigla || "—"} em {new Date(selectedMessage.respondido_em).toLocaleString("pt-BR")}
                  {selectedMessage.respondido_por_cargo ? ` (${selectedMessage.respondido_por_cargo})` : ""}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Fechar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
