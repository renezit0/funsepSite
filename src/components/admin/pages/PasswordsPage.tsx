import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Key, Plus, Edit2, Trash2, UserCheck, Info, Mail, Link2 } from "lucide-react";
import { supabase, SUPABASE_CONFIG } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface Senha {
  id: string;
  cpf: string;
  senha?: string;
  matricula: number;
  nome: string;
  created_at: string;
  created_by_sigla: string;
}

interface Beneficiario {
  matricula: number;
  nome: string;
  cpf: number;
  situacao: number;
}

const normalizeCpf = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(11, "0").slice(-11);
};

const cpfVariants = (value: string | number | null | undefined): string[] => {
  const normalized = normalizeCpf(value);
  if (!normalized) return [];

  const compact = normalized.replace(/^0+/, "") || "0";
  if (compact === normalized) return [normalized];

  return [normalized, compact];
};

export function PasswordsPage() {
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSenha, setEditingSenha] = useState<Senha | null>(null);

  // Separar o campo de busca do formulário
  const [beneficiarioSearch, setBeneficiarioSearch] = useState("");
  const [formData, setFormData] = useState({
    cpf: "",
    senha: "",
    matricula: "",
    nome: ""
  });

  // Busca para enviar link de cadastro
  const [sendLinkSearch, setSendLinkSearch] = useState("");
  const [showCustomLinkModal, setShowCustomLinkModal] = useState(false);
  const [isSendingCustomLink, setIsSendingCustomLink] = useState(false);
  const [customLinkChannel, setCustomLinkChannel] = useState<"EMAIL" | "WHATSAPP" | "AMBOS">("EMAIL");
  const [customLinkData, setCustomLinkData] = useState({
    matricula: 0,
    cpf: "",
    nome: "",
    email: "",
    telefone: "",
    mensagem: ""
  });

  const { session } = useAuth();
  const { mostrarToast, mostrarFeedback, mostrarConfirmacao } = useFeedback();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar senhas existentes
      const { data: senhasData, error: senhasError } = await supabase
        .from('senhas')
        .select('id, cpf, matricula, nome, created_at, created_by_sigla')
        .order('created_at', { ascending: false });

      if (senhasError) throw senhasError;
      setSenhas(senhasData || []);

      // Carregar TODOS os beneficiários - removendo limitação do Supabase
      console.log('Carregando beneficiários...');
      
      let allBeneficiarios: Beneficiario[] = [];
      let hasMore = true;
      let offset = 0;
      const limit = 1000;

      while (hasMore) {
        const { data: batch, error: benError, count } = await supabase
          .from("cadben")
          .select("matricula, nome, cpf, situacao", { count: 'exact' })
          .in("situacao", [1, 2])
          .order("nome")
          .range(offset, offset + limit - 1);

        if (benError) throw benError;

        if (batch && batch.length > 0) {
          allBeneficiarios = [...allBeneficiarios, ...batch];
          offset += limit;
          
          // Se retornou menos que o limite, não há mais dados
          hasMore = batch.length === limit;
          
          console.log(`Carregados ${allBeneficiarios.length} beneficiários até agora...`);
        } else {
          hasMore = false;
        }
      }

      console.log(`Total final de beneficiários carregados: ${allBeneficiarios.length}`);
      setBeneficiarios(allBeneficiarios);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cleanCpf = normalizeCpf(formData.cpf);
      
      if (editingSenha) {
        const updateData: Record<string, unknown> = {
          cpf: cleanCpf,
          matricula: parseInt(formData.matricula),
          nome: formData.nome
        };

        if (formData.senha) {
          updateData.senha = formData.senha;
        }

        // Atualizar senha existente
        const { error } = await supabase
          .from('senhas')
          .update(updateData)
          .eq('id', editingSenha.id);

        if (error) throw error;
        mostrarToast('sucesso', 'Senha atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('senhas')
          .insert({
            cpf: cleanCpf,
            senha: formData.senha,
            matricula: parseInt(formData.matricula),
            nome: formData.nome,
            created_by_sigla: session?.sigla
          });

        if (error) throw error;
        mostrarToast('sucesso', 'Senha criada com sucesso!');
      }

      setFormData({ cpf: "", senha: "", matricula: "", nome: "" });
      setBeneficiarioSearch("");
      setShowCreateModal(false);
      setEditingSenha(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar senha:', error);
      if (error.code === '23505') {
        mostrarFeedback('erro', 'Erro', 'Já existe uma senha cadastrada para este CPF');
      } else {
        mostrarFeedback('erro', 'Erro', 'Erro ao salvar senha');
      }
    }
  };

  const handleDelete = async (id: string) => {
    mostrarConfirmacao('Confirmar exclusão', 'Tem certeza que deseja excluir esta senha?', async () => {
      try {
        const { error } = await supabase
          .from('senhas')
          .delete()
          .eq('id', id);

        if (error) throw error;
        mostrarToast('sucesso', 'Senha excluída com sucesso!');
        loadData();
      } catch (error) {
        console.error('Erro ao excluir senha:', error);
        mostrarFeedback('erro', 'Erro', 'Erro ao excluir senha');
      }
    });
  };

  const handleEdit = (senha: Senha) => {
    setEditingSenha(senha);
    setFormData({
      cpf: senha.cpf,
      senha: "",
      matricula: senha.matricula.toString(),
      nome: senha.nome
    });
    setBeneficiarioSearch("");
    setShowCreateModal(true);
  };

  const handleSendResetLink = async (senha: Senha) => {
    // Buscar email do beneficiário
    const { data: beneficiario, error: benError } = await supabase
      .from('cadben')
      .select('email')
      .eq('matricula', senha.matricula)
      .maybeSingle();

    if (benError || !beneficiario) {
      mostrarFeedback('erro', 'Erro', 'Erro ao buscar dados do associado');
      return;
    }

    if (!beneficiario.email) {
      mostrarFeedback('erro', 'Erro', 'Associado não possui email cadastrado');
      return;
    }

    mostrarConfirmacao(
      'Enviar link de redefinição?',
      `Deseja enviar um link de redefinição de senha para ${senha.nome} no email ${beneficiario.email}?`,
      async () => {
        try {
          const response = await fetch(
            `${SUPABASE_CONFIG.url}/functions/v1/request-password-reset`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.token}`,
                'apikey': SUPABASE_CONFIG.key,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                cpfOrEmail: beneficiario.email
              })
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            mostrarFeedback('erro', 'Erro', result.error || 'Erro ao enviar link');
            return;
          }

          mostrarToast('sucesso', 'Link enviado com sucesso!');
        } catch (error) {
          console.error('Erro ao enviar link:', error);
          mostrarFeedback('erro', 'Erro', 'Erro ao enviar link de redefinição');
        }
      }
    );
  };

  const handleSendLinkToAnyBeneficiary = async (beneficiario: Beneficiario) => {
    // Buscar email completo
    const { data: benData, error: benError } = await supabase
      .from('cadben')
      .select('email, nome, cpf, matricula')
      .eq('matricula', beneficiario.matricula)
      .maybeSingle();

    if (benError || !benData) {
      mostrarFeedback('erro', 'Erro', 'Erro ao buscar dados do associado');
      return;
    }

    if (!benData.email) {
      mostrarFeedback('erro', 'Erro', 'Associado não possui email cadastrado. Cadastre um email antes de enviar o link.');
      return;
    }

    // Verificar se já tem senha
    const { data: senhaExistente } = await supabase
      .from('senhas')
      .select('id')
      .in('cpf', cpfVariants(benData.cpf))
      .maybeSingle();

    const mensagem = senhaExistente
      ? `Deseja enviar um link de REDEFINIÇÃO de senha para ${benData.nome} no email ${benData.email}?`
      : `Deseja enviar um link de CADASTRO de senha para ${benData.nome} no email ${benData.email}? Este associado ainda não possui senha cadastrada.`;

    const titulo = senhaExistente ? 'Enviar link de redefinição?' : 'Enviar link de cadastro?';

    mostrarConfirmacao(
      titulo,
      mensagem,
      async () => {
        try {
          const response = await fetch(
            `${SUPABASE_CONFIG.url}/functions/v1/request-password-reset`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.token}`,
                'apikey': SUPABASE_CONFIG.key,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                cpfOrEmail: benData.email
              })
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            mostrarFeedback('erro', 'Erro', result.error || 'Erro ao enviar link');
            return;
          }

          mostrarToast('sucesso', 'Link enviado com sucesso para ' + benData.email);
          setSendLinkSearch(""); // Limpar busca
        } catch (error) {
          console.error('Erro ao enviar link:', error);
          mostrarFeedback('erro', 'Erro', 'Erro ao enviar link');
        }
      }
    );
  };

  const handleOpenCustomLinkModal = async (beneficiario: Beneficiario) => {
    const { data: benData, error } = await supabase
      .from('cadben')
      .select('nome, email, telefone, telefone1')
      .eq('matricula', beneficiario.matricula)
      .maybeSingle();

    if (error || !benData) {
      mostrarFeedback('erro', 'Erro', 'Não foi possível carregar os dados do associado.');
      return;
    }

    setCustomLinkData({
      matricula: beneficiario.matricula,
      cpf: normalizeCpf(beneficiario.cpf),
      nome: benData.nome || beneficiario.nome || "",
      email: benData.email || "",
      telefone: (benData.telefone || benData.telefone1 || ""),
      mensagem: "Olá associado FUNSEP, segue sua resposta referente à ocorrência."
    });
    setCustomLinkChannel("EMAIL");
    setShowCustomLinkModal(true);
  };

  const handleSendCustomLink = async () => {
    if ((customLinkChannel === "EMAIL" || customLinkChannel === "AMBOS") && !customLinkData.email.trim()) {
      mostrarFeedback('erro', 'Erro', 'Informe um e-mail para envio.');
      return;
    }

    if ((customLinkChannel === "WHATSAPP" || customLinkChannel === "AMBOS") && !customLinkData.telefone.trim()) {
      mostrarFeedback('erro', 'Erro', 'Informe um telefone para envio via WhatsApp.');
      return;
    }

    setIsSendingCustomLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-custom-link", {
        body: {
          matricula: customLinkData.matricula,
          cpf: customLinkData.cpf,
          nome: customLinkData.nome || "Associado",
          email: customLinkData.email,
          telefone: customLinkData.telefone,
          mensagem: customLinkData.mensagem,
          canal: customLinkChannel,
        },
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || "Não foi possível enviar o link.");
      }

      mostrarToast('sucesso', 'Link personalizado enviado com sucesso!');
      setShowCustomLinkModal(false);
      setCustomLinkData({
        matricula: 0,
        cpf: "",
        nome: "",
        email: "",
        telefone: "",
        mensagem: ""
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar link personalizado.';
      mostrarFeedback('erro', 'Erro', msg);
    } finally {
      setIsSendingCustomLink(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const handleBeneficiarioSelect = (beneficiario: Beneficiario) => {
    setFormData({
      ...formData,
      matricula: beneficiario.matricula.toString(),
      nome: beneficiario.nome,
      cpf: normalizeCpf(beneficiario.cpf)
    });
    setBeneficiarioSearch(beneficiario.nome);
  };

  const filteredSenhas = senhas.filter(senha => {
    return searchTerm === "" || 
      senha.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senha.cpf?.includes(searchTerm) ||
      senha.matricula?.toString().includes(searchTerm);
  });

  // Função para remover acentos e normalizar texto
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  }

  // Função para verificar se é número
  function isNumeric(str: string): boolean {
    return /^\d+$/.test(str.trim());
  }

  // Filtro otimizado para beneficiários (modal de criar senha)
  const filteredBeneficiarios = useMemo(() => {
    if (!beneficiarioSearch || beneficiarioSearch.trim().length === 0) {
      return [];
    }

    const searchTerm = beneficiarioSearch.trim();
    const isNumberSearch = isNumeric(searchTerm);

    // Regras de busca:
    // - Para números (matrícula/CPF): busca exata
    // - Para texto: mínimo 3 caracteres
    if (!isNumberSearch && searchTerm.length < 3) {
      return [];
    }

    const normalizedSearch = normalizeText(searchTerm);

    const filtered = beneficiarios.filter(ben => {
      if (!ben) return false;

      const nome = ben.nome ? normalizeText(ben.nome.toString()) : '';
      const matricula = ben.matricula ? ben.matricula.toString() : '';
      const cpf = ben.cpf ? normalizeCpf(ben.cpf) : '';

      if (isNumberSearch) {
        // Para números: busca exata em matrícula ou CPF
        return matricula === searchTerm || cpf.includes(searchTerm);
      } else {
        // Para texto: busca por nome (mínimo 3 caracteres)
        return nome.includes(normalizedSearch);
      }
    });

    return filtered.slice(0, 50); // Limita a 50 resultados
  }, [beneficiarios, beneficiarioSearch]);

  // Filtro para envio de link (card separado)
  const filteredBeneficiariosForLink = useMemo(() => {
    if (!sendLinkSearch || sendLinkSearch.trim().length === 0) {
      return [];
    }

    const searchTerm = sendLinkSearch.trim();
    const isNumberSearch = isNumeric(searchTerm);

    if (!isNumberSearch && searchTerm.length < 3) {
      return [];
    }

    const normalizedSearch = normalizeText(searchTerm);

    const filtered = beneficiarios.filter(ben => {
      if (!ben) return false;

      const nome = ben.nome ? normalizeText(ben.nome.toString()) : '';
      const matricula = ben.matricula ? ben.matricula.toString() : '';
      const cpf = ben.cpf ? normalizeCpf(ben.cpf) : '';

      if (isNumberSearch) {
        return matricula === searchTerm || cpf.includes(searchTerm);
      } else {
        return nome.includes(normalizedSearch);
      }
    });

    return filtered.slice(0, 50);
  }, [beneficiarios, sendLinkSearch]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 sm:h-8 sm:w-8" />
            Gerenciar Senhas de Acesso
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Cadastre e gerencie senhas de acesso para beneficiários
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Senhas</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Cadastre e gerencie senhas de acesso para associados. As senhas permitem que os beneficiários acessem o sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para enviar link de cadastro/redefinição */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Link de Cadastro/Redefinição
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Busque um associado e envie um link por email para cadastrar ou redefinir senha
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar associado por nome (min. 3 letras) ou matrícula/CPF..."
                value={sendLinkSearch}
                onChange={(e) => setSendLinkSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {sendLinkSearch && (
              <div className="max-h-80 overflow-y-auto border rounded-md">
                {filteredBeneficiariosForLink.length > 0 ? (
                  filteredBeneficiariosForLink.map((ben) => (
                    <div
                      key={ben.matricula}
                      className="p-3 hover:bg-accent border-b last:border-b-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{ben.nome}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                          <span>CPF: {formatCPF(normalizeCpf(ben.cpf))}</span>
                          <span>Mat: {ben.matricula}</span>
                          <Badge variant={ben.situacao === 1 || ben.situacao === 2 ? "outline" : "destructive"}>
                            {ben.situacao === 1 || ben.situacao === 2 ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendLinkToAnyBeneficiary(ben)}
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Enviar Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenCustomLinkModal(ben)}
                          className="gap-2"
                        >
                          <Link2 className="h-4 w-4" />
                          Personalizado
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    {(() => {
                      const searchTerm = sendLinkSearch.trim();
                      const isNumber = /^\d+$/.test(searchTerm);

                      if (!isNumber && searchTerm.length < 3) {
                        return "Digite pelo menos 3 letras para buscar nomes";
                      }
                      return `Nenhum associado encontrado para "${sendLinkSearch}"`;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCustomLinkModal} onOpenChange={setShowCustomLinkModal}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-xl">
          <DialogHeader>
            <DialogTitle>Enviar link personalizado ao associado</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Canal de envio</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={customLinkChannel === "EMAIL" ? "default" : "outline"}
                  onClick={() => setCustomLinkChannel("EMAIL")}
                >
                  E-mail
                </Button>
                <Button
                  type="button"
                  variant={customLinkChannel === "WHATSAPP" ? "default" : "outline"}
                  onClick={() => setCustomLinkChannel("WHATSAPP")}
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant={customLinkChannel === "AMBOS" ? "default" : "outline"}
                  onClick={() => setCustomLinkChannel("AMBOS")}
                >
                  E-mail + WhatsApp
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={customLinkData.nome}
                onChange={(e) => setCustomLinkData({ ...customLinkData, nome: e.target.value })}
                placeholder="Nome do associado"
              />
            </div>

            {(customLinkChannel === "EMAIL" || customLinkChannel === "AMBOS") && (
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={customLinkData.email}
                  onChange={(e) => setCustomLinkData({ ...customLinkData, email: e.target.value })}
                  placeholder="associado@email.com"
                />
              </div>
            )}

            {(customLinkChannel === "WHATSAPP" || customLinkChannel === "AMBOS") && (
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input
                  value={customLinkData.telefone}
                  onChange={(e) => setCustomLinkData({ ...customLinkData, telefone: e.target.value })}
                  placeholder="(41) 99999-9999"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={4}
                value={customLinkData.mensagem}
                onChange={(e) => setCustomLinkData({ ...customLinkData, mensagem: e.target.value })}
                placeholder="Olá associado FUNSEP, segue sua resposta referente à ocorrência."
              />
              <p className="text-xs text-muted-foreground">
                O link de redefinição é gerado automaticamente e será incluído no e-mail/WhatsApp.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCustomLinkModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendCustomLink} disabled={isSendingCustomLink}>
                {isSendingCustomLink ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setEditingSenha(null);
            setFormData({ cpf: "", senha: "", matricula: "", nome: "" });
            setBeneficiarioSearch("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Nova Senha</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingSenha ? "Editar Senha" : "Cadastrar Nova Senha"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beneficiarioSearch">Buscar Beneficiário</Label>
                  <Input
                    id="beneficiarioSearch"
                    placeholder="Nome (min. 3 letras) ou matrícula/CPF completo..."
                    value={beneficiarioSearch}
                    onChange={(e) => setBeneficiarioSearch(e.target.value)}
                  />
                  
                  {beneficiarioSearch && (
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      {filteredBeneficiarios.length > 0 ? (
                        filteredBeneficiarios.map((ben) => (
                          <button
                            key={ben.matricula}
                            type="button"
                            className="w-full text-left p-2 hover:bg-accent flex items-center justify-between"
                            onClick={() => handleBeneficiarioSelect(ben)}
                          >
                            <div>
                              <div className="font-medium">{ben.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                CPF: {formatCPF(normalizeCpf(ben.cpf))}
                              </div>
                            </div>
                            <Badge variant={ben.situacao === 1 || ben.situacao === 2 ? "outline" : "destructive"}>
                              Mat: {ben.matricula}
                            </Badge>
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-2">
                          {(() => {
                            const searchTerm = beneficiarioSearch.trim();
                            const isNumber = /^\d+$/.test(searchTerm);
                            
                            if (!isNumber && searchTerm.length < 3) {
                              return "Digite pelo menos 3 letras para buscar nomes";
                            }
                            return `Nenhum beneficiário encontrado para "${beneficiarioSearch}"`;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formatCPF(formData.cpf)}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    maxLength={14}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder={editingSenha ? "Deixe em branco para não alterar" : "Digite a senha"}
                    required={!editingSenha}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input
                  id="matricula"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  required
                  readOnly={!editingSenha} // Só permite edição manual quando editando
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingSenha ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Senhas cadastradas ({loading ? 0 : filteredSenhas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            {loading ? (
              <>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                        <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-40 rounded"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                        <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-40 rounded"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                        <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-40 rounded"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                        <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-40 rounded"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-5 w-5 rounded"></div>
                        <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
                      </div>
                      <div className="skeleton-shimmer h-4 w-40 rounded"></div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                      <div className="skeleton-shimmer h-8 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
              </>
            ) : filteredSenhas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma senha encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <>
                {filteredSenhas.map((senha) => (
              <div
                key={senha.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-sm sm:text-base leading-tight">{senha.nome}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div>
                        <strong>CPF:</strong> {formatCPF(senha.cpf)}
                      </div>
                      <div>
                        <strong>Matrícula:</strong> {senha.matricula}
                      </div>
                      <div>
                        <strong>Criado por:</strong> {senha.created_by_sigla}
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <strong>Criado em:</strong> {new Date(senha.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4 flex-shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendResetLink(senha)}
                      className="h-8 text-xs"
                      title="Enviar link de redefinição"
                    >
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Link</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(senha)}
                      className="h-8 text-xs"
                    >
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(senha.id)}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
