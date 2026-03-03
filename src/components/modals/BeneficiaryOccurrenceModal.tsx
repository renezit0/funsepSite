import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";

interface BeneficiaryOccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupportMessage {
  id: string;
  nome: string;
  matricula: number | null;
  email: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  mensagem: string;
  status: string;
  respondido_por_sigla: string | null;
  respondido_em: string | null;
  created_at: string;
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

const normalizeStatus = (value: string) => (value === "RESPONDIDO" ? "ATENDIDO" : value);

export function BeneficiaryOccurrenceModal({ isOpen, onClose }: BeneficiaryOccurrenceModalProps) {
  const { session } = useAuth();
  const { userData } = useUserData();
  const { mostrarFeedback } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [newOccurrenceMessage, setNewOccurrenceMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );

  const userMatricula = Number(session?.user?.matricula || 0);
  const nome = userData?.cadben?.nome || session?.user?.nome || "";
  const email = userData?.cadben?.email || "";
  const cpf = String(userData?.cadben?.cpf || "").replace(/\D/g, "").padStart(11, "0").slice(-11);
  const dataNascimentoRaw = String(userData?.cadben?.dtnasc || "").trim();
  const dataNascimento = dataNascimentoRaw.length >= 10 ? dataNascimentoRaw.slice(0, 10) : "";
  const telefone = String(userData?.cadben?.telefone || userData?.cadben?.telefone1 || "").replace(/\D/g, "");

  const loadMessages = async () => {
    if (!userMatricula) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("matricula", userMatricula)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const loaded = (data || []).map((item) => ({ ...item, status: normalizeStatus(item.status) }));
      setMessages(loaded as SupportMessage[]);
      if (loaded.length > 0 && !selectedMessageId) {
        setSelectedMessageId(loaded[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error);
      mostrarFeedback("erro", "Erro", "Não foi possível carregar suas ocorrências.");
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (!isOpen || !userMatricula) return;
    loadMessages();
  }, [isOpen, userMatricula]);

  useEffect(() => {
    if (!selectedMessageId) {
      setReplies([]);
      return;
    }
    loadReplies(selectedMessageId);
  }, [selectedMessageId]);

  const handleCreateOccurrence = async () => {
    if (!newOccurrenceMessage.trim()) {
      mostrarFeedback("erro", "Erro", "Descreva a ocorrência.");
      return;
    }

    if (!nome || !email || cpf.length !== 11 || !dataNascimento || telefone.length < 10) {
      mostrarFeedback("erro", "Erro", "Seus dados cadastrais estão incompletos. Entre em contato com a FUNSEP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-support-message", {
        body: {
          nome,
          matricula: userMatricula,
          matriculaDesconhecida: false,
          email,
          cpf,
          dataNascimento,
          telefone,
          mensagem: newOccurrenceMessage.trim(),
          origem: "ASSOCIADO_PORTAL",
        },
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || "Falha ao abrir ocorrência");
      }

      setNewOccurrenceMessage("");
      await loadMessages();
      mostrarFeedback("sucesso", "Ocorrência aberta", "Sua ocorrência foi registrada com sucesso.");
    } catch (error) {
      console.error("Erro ao abrir ocorrência:", error);
      const msg = error instanceof Error ? error.message : "Não foi possível abrir a ocorrência.";
      mostrarFeedback("erro", "Erro", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) return;
    if (normalizeStatus(selectedMessage.status) === "ATENDIDO") {
      mostrarFeedback("erro", "Ocorrência atendida", "Esta ocorrência já foi marcada como atendida.");
      return;
    }

    setIsReplying(true);
    try {
      const { error: replyError } = await supabase
        .from("support_message_replies")
        .insert({
          support_message_id: selectedMessage.id,
          sender_tipo: "ASSOCIADO",
          sender_nome: nome || session?.user?.nome || "Associado",
          sender_sigla: null,
          mensagem: replyMessage.trim(),
        });

      if (replyError) throw replyError;

      const { error: updateError } = await supabase
        .from("support_messages")
        .update({
          status: "EM_ANALISE",
          respondido_por_sigla: null,
          respondido_por_cargo: null,
          respondido_em: null,
        })
        .eq("id", selectedMessage.id);

      if (updateError) throw updateError;

      setReplyMessage("");
      await loadMessages();
      await loadReplies(selectedMessage.id);
      mostrarFeedback("sucesso", "Resposta enviada", "Sua resposta foi registrada.");
    } catch (error) {
      console.error("Erro ao responder ocorrência:", error);
      mostrarFeedback("erro", "Erro", "Não foi possível enviar sua resposta.");
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === "ATENDIDO") return <Badge className="bg-emerald-100 text-emerald-700">Atendido</Badge>;
    if (normalized === "EM_ANALISE") return <Badge className="bg-amber-100 text-amber-700">Em análise</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Ocorrências do Sistema
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>Nova ocorrência</Label>
              <Textarea
                rows={4}
                value={newOccurrenceMessage}
                onChange={(e) => setNewOccurrenceMessage(e.target.value)}
                placeholder="Descreva o problema encontrado no sistema."
                disabled={isSubmitting}
              />
              <Button onClick={handleCreateOccurrence} disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Abrir ocorrência
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Label>Minhas ocorrências</Label>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ocorrência aberta.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {messages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMessageId(item.id)}
                      className={`w-full text-left rounded-md border p-3 ${selectedMessageId === item.id ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString("pt-BR")}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{item.mensagem}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedMessage && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conversa da ocorrência</Label>
                {getStatusBadge(selectedMessage.status)}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2">
                    <p className="text-[11px] opacity-90 mb-1 text-right">
                      Você • {new Date(selectedMessage.created_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.mensagem}</p>
                  </div>
                </div>

                {replies.map((reply) => (
                  <div key={reply.id} className={`flex ${reply.sender_tipo === "ASSOCIADO" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                        reply.sender_tipo === "ASSOCIADO"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border"
                      }`}
                    >
                      <p className={`text-[11px] mb-1 ${reply.sender_tipo === "ASSOCIADO" ? "text-right opacity-90" : "text-muted-foreground"}`}>
                        {reply.sender_tipo === "EQUIPE" ? `Equipe (${reply.sender_sigla || "FUNSEP"})` : "Você"} •{" "}
                        {new Date(reply.created_at).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{reply.mensagem}</p>
                    </div>
                  </div>
                ))}
              </div>

              {normalizeStatus(selectedMessage.status) === "ATENDIDO" && selectedMessage.respondido_em ? (
                <p className="text-xs text-muted-foreground">
                  Atendido por {selectedMessage.respondido_por_sigla || "—"} em{" "}
                  {new Date(selectedMessage.respondido_em).toLocaleString("pt-BR")}
                </p>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Responder esta ocorrência..."
                    disabled={isReplying}
                  />
                  <Button onClick={handleReply} disabled={isReplying || !replyMessage.trim()} className="gap-2">
                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar resposta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
