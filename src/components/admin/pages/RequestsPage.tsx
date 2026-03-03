import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, CheckCircle, XCircle, Eye, Download, ExternalLink, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Requerimento {
  id: string;
  tipo: string;
  matricula: number;
  nome_solicitante: string;
  email: string;
  telefone: string | null;
  dados: any;
  status: string;
  observacoes_admin: string | null;
  created_at: string;
  updated_at: string;
  respondido_por_sigla: string | null;
  respondido_em: string | null;
  documentos: any;
}

export function RequestsPage() {
  const [requerimentos, setRequerimentos] = useState<Requerimento[]>([]);
  const [filteredRequerimentos, setFilteredRequerimentos] = useState<Requerimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Requerimento | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDENTE");
  const { toast } = useToast();

  const SkeletonCard = () => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton-shimmer h-6 w-64 rounded"></div>
            <div className="skeleton-shimmer h-4 w-48 rounded"></div>
          </div>
          <div className="skeleton-shimmer h-6 w-24 rounded"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton-shimmer h-4 w-40 rounded"></div>
          <div className="skeleton-shimmer h-4 w-36 rounded"></div>
          <div className="skeleton-shimmer h-4 w-44 rounded"></div>
          <div className="skeleton-shimmer h-4 w-32 rounded"></div>
        </div>
        <div className="skeleton-shimmer h-16 w-full rounded"></div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-9 w-24 rounded"></div>
          <div className="skeleton-shimmer h-9 w-24 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (statusFilter === "TODOS") {
      setFilteredRequerimentos(requerimentos);
    } else {
      setFilteredRequerimentos(requerimentos.filter(r => r.status === statusFilter));
    }
  }, [requerimentos, statusFilter]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("requerimentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequerimentos(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os requerimentos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      const { error } = await supabase
        .from("requerimentos")
        .update({
          status: newStatus,
          observacoes_admin: observacoes,
          respondido_em: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status do requerimento atualizado.",
      });

      setSelectedRequest(null);
      setNewStatus("");
      setObservacoes("");
      loadRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o requerimento.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      PENDENTE: { variant: "secondary", icon: Clock },
      EM_ANALISE: { variant: "default", icon: Eye },
      APROVADO: { variant: "default", icon: CheckCircle },
      NEGADO: { variant: "destructive", icon: XCircle },
      CANCELADO: { variant: "outline", icon: XCircle },
    };

    const config = variants[status] || variants.PENDENTE;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getRequestTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      exclusao_associado: "Exclusão de Associado",
      exclusao_dependente: "Exclusão de Dependente",
      inclusao_associado: "Inclusão de Associado",
      inclusao_dependente: "Inclusão de Dependente",
      inclusao_recem_nascido: "Inclusão de Recém-Nascido",
      inscricao_pensionista: "Inscrição como Pensionista",
      requerimento_21_anos: "Requerimento - 21 Anos",
      requerimento_diversos: "Requerimento - Diversos",
      requerimento_auxilio_saude: "Requerimento para Auxílio Saúde",
      requerimento_reembolso: "Requerimento para Reembolso",
      termo_ciencia: "Termo de Ciência",
      termo_compromisso: "Termo de Compromisso",
      termo_opcao: "Termo de Opção",
    };
    return labels[tipo] || tipo;
  };

  const renderDocumentos = (documentos: Array<{ tipo: string; url: string; nome: string }> | null) => {
    if (!documentos || documentos.length === 0) {
      return <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>;
    }

    const labelMap: Record<string, string> = {
      rg_cpf: "RG e CPF",
      comprovante_endereco: "Comprovante de Endereço",
      contracheque: "Contracheque",
      certidao_casamento: "Certidão de Casamento/União Estável",
      nota_fiscal: "Nota Fiscal/Recibo",
      comprovante_pagamento: "Comprovante de Pagamento",
      documento_geral: "Documento Anexo",
    };

    return (
      <div className="space-y-2">
        {documentos.map((doc, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{labelMap[doc.tipo] || doc.tipo}</span>
              <span className="text-xs text-muted-foreground">({doc.nome})</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(doc.url, '_blank')}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
          Requerimentos
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gerencie os requerimentos enviados pelos associados
        </p>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Requerimentos</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visualize, analise e gerencie requerimentos enviados pelos associados. Atualize status e adicione observações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <Label className="text-sm">Filtrar por Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
            <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
            <SelectItem value="APROVADO">Aprovados</SelectItem>
            <SelectItem value="NEGADO">Negados</SelectItem>
            <SelectItem value="CANCELADO">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs sm:text-sm text-muted-foreground">
          ({filteredRequerimentos.length} {filteredRequerimentos.length === 1 ? 'requerimento' : 'requerimentos'})
        </span>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredRequerimentos.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">
                Nenhum requerimento encontrado.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequerimentos.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {getRequestTypeLabel(req.tipo)}
                    </CardTitle>
                    <CardDescription>
                      {req.nome_solicitante} - Matrícula: {req.matricula}
                    </CardDescription>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {req.email}
                  </div>
                  <div>
                    <span className="font-medium">Telefone:</span>{" "}
                    {req.telefone || "Não informado"}
                  </div>
                  <div>
                    <span className="font-medium">Enviado em:</span>{" "}
                    {new Date(req.created_at).toLocaleString("pt-BR")}
                  </div>
                  {req.dados?.cpf && (
                    <div>
                      <span className="font-medium">CPF:</span> {req.dados.cpf}
                    </div>
                  )}
                </div>
                
                <div className="bg-muted/30 p-3 rounded-md space-y-3 text-sm">
                  <p className="font-semibold text-base">Detalhes do Requerimento:</p>
                  
                  {req.tipo === "inclusao_associado" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Inclusão de Associado</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.cpf && <div><span className="font-medium">CPF:</span> {req.dados.cpf}</div>}
                        {req.dados.dtnasc && <div><span className="font-medium">Data Nasc:</span> {req.dados.dtnasc}</div>}
                        {req.dados.sexo && <div><span className="font-medium">Sexo:</span> {req.dados.sexo}</div>}
                        {req.dados.estcivil && <div><span className="font-medium">Estado Civil:</span> {req.dados.estcivil}</div>}
                        {req.dados.nomemae && <div className="col-span-2"><span className="font-medium">Nome da Mãe:</span> {req.dados.nomemae}</div>}
                        {req.dados.identidade && <div><span className="font-medium">RG:</span> {req.dados.identidade}</div>}
                        {req.dados.orgemi && <div><span className="font-medium">Órgão Emissor:</span> {req.dados.orgemi}</div>}
                        {req.dados.dtemirg && <div><span className="font-medium">Data Emissão RG:</span> {req.dados.dtemirg}</div>}
                        {req.dados.endereco && <div className="col-span-2"><span className="font-medium">Endereço:</span> {req.dados.endereco}, {req.dados.numero}{req.dados.complemento ? ` - ${req.dados.complemento}` : ''} - {req.dados.bairro}</div>}
                        {req.dados.cidade && <div><span className="font-medium">Cidade/UF:</span> {req.dados.cidade}/{req.dados.uf}</div>}
                        {req.dados.cep && <div><span className="font-medium">CEP:</span> {req.dados.cep}</div>}
                        {req.dados.telefone_res && <div><span className="font-medium">Tel. Residencial:</span> {req.dados.telefone_res}</div>}
                        {req.dados.telefone_com && <div><span className="font-medium">Tel. Comercial:</span> {req.dados.telefone_com}</div>}
                        {req.dados.cargo && <div><span className="font-medium">Cargo:</span> {req.dados.cargo}</div>}
                        {req.dados.localtrab && <div><span className="font-medium">Local Trabalho:</span> {req.dados.localtrab}</div>}
                        {req.dados.matrfunc && <div><span className="font-medium">Matrícula TJ:</span> {req.dados.matrfunc}</div>}
                        {req.dados.pispasep && <div><span className="font-medium">PIS/PASEP:</span> {req.dados.pispasep}</div>}
                        {req.dados.banco && <div><span className="font-medium">Banco:</span> {req.dados.banco}</div>}
                        {req.dados.agencia && <div><span className="font-medium">Agência:</span> {req.dados.agencia}</div>}
                        {req.dados.contacorr && <div><span className="font-medium">Conta:</span> {req.dados.contacorr}</div>}
                        {req.dados.tipacomoda && <div><span className="font-medium">Acomodação:</span> {req.dados.tipacomoda}</div>}
                      </div>
                      {req.dados.dependentes && req.dados.dependentes.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="font-medium mb-2">Dependentes ({req.dados.dependentes.length}):</p>
                          {req.dados.dependentes.map((dep: any, idx: number) => (
                            <div key={idx} className="ml-4 mb-2 p-2 bg-background/50 rounded">
                              <p className="font-medium text-sm">{idx + 1}. {dep.nome_dep}</p>
                              <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                                {dep.parent_dep && <div>Parentesco: {dep.parent_dep}</div>}
                                {dep.sexo_dep && <div>Sexo: {dep.sexo_dep}</div>}
                                {dep.dtnasc_dep && <div>Nasc: {dep.dtnasc_dep}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {req.tipo === "inclusao_dependente" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Inclusão de Dependente</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.nome_dependente && <div className="col-span-2"><span className="font-medium">Nome:</span> {req.dados.nome_dependente}</div>}
                        {req.dados.cpf_dependente && <div><span className="font-medium">CPF:</span> {req.dados.cpf_dependente}</div>}
                        {req.dados.dtnasc_dependente && <div><span className="font-medium">Data Nasc:</span> {req.dados.dtnasc_dependente}</div>}
                        {req.dados.nomemae_dependente && <div className="col-span-2"><span className="font-medium">Nome da Mãe:</span> {req.dados.nomemae_dependente}</div>}
                        {req.dados.tipacomoda && <div><span className="font-medium">Acomodação:</span> {req.dados.tipacomoda}</div>}
                      </div>
                    </div>
                  )}

                  {req.tipo === "inclusao_recem_nascido" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Inclusão de Recém-Nascido</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.nome_recem_nascido && <div className="col-span-2"><span className="font-medium">Nome:</span> {req.dados.nome_recem_nascido}</div>}
                        {req.dados.data_nascimento && <div><span className="font-medium">Data Nascimento:</span> {req.dados.data_nascimento}</div>}
                        {req.dados.tipacomoda && <div><span className="font-medium">Acomodação:</span> {req.dados.tipacomoda}</div>}
                      </div>
                    </div>
                  )}

                  {req.tipo === "exclusao_dependente" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Exclusão de Dependente</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.nome_dependente_excluir && <div className="col-span-2"><span className="font-medium">Dependente:</span> {req.dados.nome_dependente_excluir}</div>}
                      </div>
                    </div>
                  )}

                  {req.tipo === "requerimento_21_anos" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Permanência 21 Anos</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.nome_dependente && <div className="col-span-2"><span className="font-medium">Dependente:</span> {req.dados.nome_dependente}</div>}
                        {req.dados.dtnasc_dependente && <div><span className="font-medium">Data Nasc:</span> {req.dados.dtnasc_dependente}</div>}
                      </div>
                    </div>
                  )}

                  {req.tipo === "requerimento_reembolso" && req.dados && (
                    <div className="space-y-2">
                      <p className="font-medium text-primary">Requerimento de Reembolso</p>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {req.dados.cartao_unimed && <div><span className="font-medium">Cartão Unimed:</span> {req.dados.cartao_unimed}</div>}
                        {req.dados.nome_beneficiario && <div><span className="font-medium">Beneficiário:</span> {req.dados.nome_beneficiario}</div>}
                        {req.dados.motivo && <div className="col-span-2"><span className="font-medium">Motivo:</span> {req.dados.motivo}</div>}
                        {req.dados.valor && <div><span className="font-medium">Valor:</span> R$ {req.dados.valor}</div>}
                        {req.dados.titular_conta && <div className="col-span-2"><span className="font-medium">Titular Conta:</span> {req.dados.titular_conta}</div>}
                        {req.dados.banco_reemb && <div><span className="font-medium">Banco:</span> {req.dados.banco_reemb}</div>}
                        {req.dados.agencia_reemb && <div><span className="font-medium">Agência:</span> {req.dados.agencia_reemb}</div>}
                        {req.dados.conta_reemb && <div><span className="font-medium">Conta:</span> {req.dados.conta_reemb}</div>}
                      </div>
                    </div>
                  )}

                  {req.dados?.descricao && (
                    <div className="space-y-1">
                      <p className="font-medium text-primary">Descrição:</p>
                      <p className="text-sm pl-2">{req.dados.descricao}</p>
                    </div>
                  )}
                </div>

                {req.observacoes_admin && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Observações da Administração:</p>
                    <p className="text-sm">{req.observacoes_admin}</p>
                  </div>
                )}
                {req.documentos && req.documentos.length > 0 && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-2">Documentos Anexados:</p>
                    {renderDocumentos(req.documentos)}
                  </div>
                )}
                <Button
                  onClick={() => {
                    setSelectedRequest(req);
                    setNewStatus(req.status);
                    setObservacoes(req.observacoes_admin || "");
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Gerenciar Requerimento</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize o status e adicione observações ao requerimento
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {selectedRequest.documentos && selectedRequest.documentos.length > 0 && (
                <div>
                  <Label>Documentos Anexados</Label>
                  <div className="mt-2">
                    {renderDocumentos(selectedRequest.documentos)}
                  </div>
                </div>
              )}
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="EM_ANALISE">EM ANÁLISE</SelectItem>
                    <SelectItem value="APROVADO">APROVADO</SelectItem>
                    <SelectItem value="NEGADO">NEGADO</SelectItem>
                    <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre este requerimento..."
                  rows={4}
                />
              </div>
              <Button onClick={handleUpdateStatus} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
