import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { FileText, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestDocumentUpload } from "@/components/RequestDocumentUpload";
import { ClassicFormsView } from "@/components/requests/ClassicFormsView";
import { ExclusaoAssociadoForm } from "@/components/requests/ExclusaoAssociadoForm";
import { ExclusaoDependenteForm } from "@/components/requests/ExclusaoDependenteForm";
import { InclusaoAssociadoForm } from "@/components/requests/InclusaoAssociadoForm";
import { InclusaoDependenteForm } from "@/components/requests/InclusaoDependenteForm";
import { InclusaoRecemNascidoForm } from "@/components/requests/InclusaoRecemNascidoForm";
import { InscricaoPensionistaForm } from "@/components/requests/InscricaoPensionistaForm";
import { Requerimento21AnosForm } from "@/components/requests/Requerimento21AnosForm";
import { RequerimentoAuxilioSaudeForm } from "@/components/requests/RequerimentoAuxilioSaudeForm";
import { TermoCienciaForm } from "@/components/requests/TermoCienciaForm";
import { TermoCompromissoForm } from "@/components/requests/TermoCompromissoForm";
import { TermoOpcaoForm } from "@/components/requests/TermoOpcaoForm";

const requestTypes = [
  { value: "exclusao_associado", label: "Exclusão de Associado", requiresLogin: true },
  { value: "exclusao_dependente", label: "Exclusão de Dependente", requiresLogin: true },
  { value: "inclusao_associado", label: "Inclusão de Associado", requiresLogin: false },
  { value: "inclusao_dependente", label: "Inclusão de Dependente", requiresLogin: true },
  { value: "inclusao_recem_nascido", label: "Inclusão de Recém-Nascido", requiresLogin: true },
  { value: "inscricao_pensionista", label: "Inscrição como Pensionista", requiresLogin: true },
  { value: "requerimento_21_anos", label: "Requerimento - 21 Anos", requiresLogin: true },
  { value: "requerimento_auxilio_saude", label: "Requerimento para Auxílio Saúde", requiresLogin: true },
  { value: "requerimento_diversos", label: "Requerimento - Diversos", requiresLogin: true },
  { value: "requerimento_reembolso", label: "Requerimento para Reembolso", requiresLogin: true },
  { value: "termo_ciencia", label: "Termo de Ciência", requiresLogin: true },
  { value: "termo_compromisso", label: "Termo de Compromisso", requiresLogin: true },
  { value: "termo_opcao", label: "Termo de Opção", requiresLogin: true },
];

export function RequestsPage() {
  const { session } = useAuth();
  const { userData, isLoading: isLoadingUserData } = useUserData();
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState<any>({
    nome: session?.user?.nome || "",
    matricula: session?.user?.matricula || "",
    email: "",
    telefone: "",
    documentos: [],
  });

  // Preencher dados automaticamente quando userData estiver disponível
  useEffect(() => {
    if (userData?.cadben && session) {
      setFormData((prev: any) => ({
        ...prev,
        nome: userData.cadben.nome || session.user?.nome || "",
        matricula: userData.cadben.matricula || session.user?.matricula || "",
        email: userData.cadben.email || prev.email,
        telefone: userData.cadben.telefone || userData.cadben.telefone1 || prev.telefone,
        cpf: userData.cadben.cpf || "",
        dtnasc: userData.cadben.dtnasc || "",
        sexo: userData.cadben.sexo || "",
        nomemae: userData.cadben.nomemae || "",
        identidade: userData.cadben.identidade || "",
        orgemi: userData.cadben.orgemi || "",
        dtemirg: userData.cadben.dtemirg || "",
        endereco: userData.cadben.endereco || "",
        numero: userData.cadben.numero || "",
        complemento: userData.cadben.complemento || "",
        bairro: userData.cadben.bairro || "",
        cidade: userData.cadben.cidade || "",
        uf: userData.cadben.uf || "",
        cep: userData.cadben.cep || "",
        cargo: userData.cadben.cargo || "",
        localtrab: userData.cadben.localtrab || "",
        matrfunc: userData.cadben.matnoipe || "",
        pispasep: userData.cadben.pispasep || "",
        banco: userData.cadben.banco || "",
        agencia: userData.cadben.agencia || "",
        contacorr: userData.cadben.contacorr || "",
        tipacomoda: userData.cadben.tipacomoda || "",
        dependentes: userData.dependentes || [],
      }));
    }
  }, [userData, session]);

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDocumentUpload = (docType: string, url: string, fileName: string) => {
    const docs = formData.documentos || [];
    if (url) {
      // Adicionar ou atualizar documento
      const existingIndex = docs.findIndex((d: any) => d.tipo === docType);
      if (existingIndex >= 0) {
        docs[existingIndex] = { tipo: docType, url, nome: fileName };
      } else {
        docs.push({ tipo: docType, url, nome: fileName });
      }
    } else {
      // Remover documento
      const filtered = docs.filter((d: any) => d.tipo !== docType);
      setFormData({ ...formData, documentos: filtered });
      return;
    }
    setFormData({ ...formData, documentos: docs });
  };

  const getDocument = (docType: string) => {
    const docs = formData.documentos || [];
    return docs.find((d: any) => d.tipo === docType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedReqType = requestTypes.find(t => t.value === selectedType);
    
    if (!session && selectedReqType?.requiresLogin) {
      mostrarFeedback('erro', 'Erro', 'Você precisa estar logado para enviar este tipo de requerimento.');
      return;
    }

    if (!selectedType) {
      mostrarFeedback('erro', 'Erro', 'Selecione o tipo de requerimento.');
      return;
    }

    if (!formData.telefone || formData.telefone.trim() === "") {
      mostrarFeedback('erro', 'Erro', 'O telefone para contato é obrigatório.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("requerimentos").insert({
        tipo: selectedType,
        matricula: session?.user?.matricula || 0,
        nome_solicitante: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        dados: formData,
        documentos: formData.documentos || [],
        status: "PENDENTE",
      });

      if (error) throw error;

      mostrarToast('sucesso', 'Seu requerimento foi enviado com sucesso.');

      // Reset form
      setSelectedType("");
      setFormData({
        nome: session?.user?.nome || "",
        matricula: session?.user?.matricula || "",
        email: "",
        telefone: "",
        documentos: [],
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      mostrarFeedback('erro', 'Erro', 'Não foi possível enviar seu requerimento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    const props = {
      formData,
      updateFormData,
      handleDocumentUpload,
      getDocument,
    };

    switch (selectedType) {
      case "exclusao_associado":
        return <ExclusaoAssociadoForm formData={formData} updateFormData={updateFormData} />;
      
      case "exclusao_dependente":
        return <ExclusaoDependenteForm {...props} />;
      
      case "inclusao_associado":
        return <InclusaoAssociadoForm {...props} />;
      
      case "inclusao_dependente":
        return <InclusaoDependenteForm {...props} />;
      
      case "inclusao_recem_nascido":
        return <InclusaoRecemNascidoForm {...props} />;
      
      case "inscricao_pensionista":
        return <InscricaoPensionistaForm {...props} />;
      
      case "requerimento_21_anos":
        return <Requerimento21AnosForm {...props} />;
      
      case "requerimento_auxilio_saude":
        return <RequerimentoAuxilioSaudeForm {...props} />;
      
      case "requerimento_reembolso":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Titular *</Label>
              <Input value={formData.nome_titular || formData.nome} onChange={(e) => updateFormData("nome_titular", e.target.value)} required />
            </div>
...
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Documentos Obrigatórios</h3>
              <RequestDocumentUpload
                label="Nota Fiscal ou Recibo (com CNPJ ou CPF)"
                required
                requestType="requerimento_reembolso"
                onUpload={(url, name) => handleDocumentUpload("nota_fiscal", url, name)}
                currentFile={getDocument("nota_fiscal")}
              />
              <RequestDocumentUpload
                label="Comprovante de Pagamento"
                required
                requestType="requerimento_reembolso"
                onUpload={(url, name) => handleDocumentUpload("comprovante_pagamento", url, name)}
                currentFile={getDocument("comprovante_pagamento")}
              />
            </div>
          </div>
        );
      
      case "termo_ciencia":
        return <TermoCienciaForm formData={formData} updateFormData={updateFormData} />;
      
      case "termo_compromisso":
        return <TermoCompromissoForm formData={formData} updateFormData={updateFormData} />;
      
      case "termo_opcao":
        return <TermoOpcaoForm formData={formData} updateFormData={updateFormData} />;

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição do Requerimento *</Label>
              <Textarea
                value={formData.descricao || ""}
                onChange={(e) => updateFormData("descricao", e.target.value)}
                placeholder="Descreva detalhadamente seu requerimento..."
                rows={6}
                required
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Documentos Comprobatórios</h3>
              <RequestDocumentUpload
                label="Documento Anexo (se necessário)"
                requestType={selectedType}
                onUpload={(url, name) => handleDocumentUpload("documento_geral", url, name)}
                currentFile={getDocument("documento_geral")}
              />
            </div>
          </div>
        );
    }
  };

  const availableTypes = session 
    ? requestTypes 
    : requestTypes.filter(t => !t.requiresLogin);

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Requerimentos
          </CardTitle>
          <CardDescription>
            Envie seus requerimentos para a administração do FUNSEP
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="classic" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 print:hidden">
          <TabsTrigger value="classic">Formulários Clássicos</TabsTrigger>
          <TabsTrigger value="digital">Sistema Digital</TabsTrigger>
        </TabsList>

        <TabsContent value="classic" className="mt-6">
          <ClassicFormsView />
        </TabsContent>

        <TabsContent value="digital" className="mt-6">
          <Card>
          <CardHeader>
            <CardTitle>Novo Requerimento</CardTitle>
            <CardDescription>
              Preencha todos os campos obrigatórios (*) para enviar seu requerimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {session && (
                <>
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={session.user.nome} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input value={session.user.matricula} disabled className="bg-muted" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Requerimento *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de requerimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <>
                  <div className="space-y-2">
                    <Label>E-mail para Contato *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone para Contato *</Label>
                    <Input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => updateFormData("telefone", e.target.value)}
                      placeholder="(41) 99999-9999"
                      required
                    />
                  </div>

                  {renderFormFields()}
                </>
              )}

              <Button type="submit" disabled={isSubmitting || !selectedType} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Enviando..." : "Enviar Requerimento"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}