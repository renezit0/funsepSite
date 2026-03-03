import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus, Eye, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Dependent {
  matricula: number;
  nrodep: number;
  nome: string;
  parent: number;
  parentesco_nome?: string;
  titular_nome?: string;
  situacao: number;
  dtnasc: string;
  sexo: string;
  cpf: string;
  nomemae: string;
  email: string;
}

export function DependentsPage() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(null);

  const SkeletonCard = () => (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="skeleton-shimmer h-5 w-48 rounded"></div>
            <div className="skeleton-shimmer h-6 w-16 rounded"></div>
            <div className="skeleton-shimmer h-6 w-20 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="skeleton-shimmer h-4 w-32 rounded"></div>
            <div className="skeleton-shimmer h-4 w-36 rounded"></div>
            <div className="skeleton-shimmer h-4 w-28 rounded"></div>
            <div className="skeleton-shimmer h-4 w-40 rounded"></div>
            <div className="skeleton-shimmer h-4 w-32 rounded"></div>
            <div className="skeleton-shimmer h-4 w-24 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const searchDependents = async () => {
    if (!searchTerm.trim()) {
      setDependents([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from("caddep").select(`
          matricula, nrodep, nome, parent, situacao, dtnasc, sexo, cpf, nomemae, email,
          tabgrpar!fk_caddep_parent_tabgrpar(nome)
        `);

      // Aplicar filtros de busca
      if (searchTerm.trim()) {
        const isNumeric = /^\d+$/.test(searchTerm.trim());

        if (isNumeric) {
          // Se for numérico, buscar por matrícula
          query = query.eq("matricula", parseInt(searchTerm));
        } else {
          // Se não for numérico, buscar por nome
          query = query.ilike("nome", `%${searchTerm}%`);
        }
      }

      // Aplicar filtro de status se selecionado
      if (statusFilter !== null) {
        if (statusFilter === 1) {
          // Ativos e Reativados
          query = query.in("situacao", [1, 2]);
        } else {
          query = query.eq("situacao", statusFilter);
        }
      }

      query = query.order("matricula, nrodep").limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos titulares
      const matriculas = [...new Set((data || []).map((item) => item.matricula))];

      let titularesMap = new Map();
      if (matriculas.length > 0) {
        const { data: titulares } = await supabase.from("cadben").select("matricula, nome").in("matricula", matriculas);

        if (titulares) {
          titulares.forEach((titular) => {
            titularesMap.set(titular.matricula, titular.nome);
          });
        }
      }

      // Processar dados para incluir nome do parentesco e titular
      const processedData = (data || []).map((item) => ({
        ...item,
        parentesco_nome: item.tabgrpar?.nome || "Não informado",
        titular_nome: titularesMap.get(item.matricula) || "Não informado",
      }));

      setDependents(processedData);
    } catch (error) {
      console.error("Erro ao buscar dependentes:", error);
      setDependents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchDependents();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (situacao: number) => {
    switch (situacao) {
      case 1:
        return <Badge variant="default">Ativo</Badge>;
      case 2:
        return <Badge variant="secondary">Reativado</Badge>;
      case 3:
        return <Badge variant="destructive">Inativo</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getParentTypeBadge = (parentesco_nome?: string) => {
    if (!parentesco_nome || parentesco_nome === "Não informado") {
      return <Badge variant="outline">Não informado</Badge>;
    }
    return <Badge variant="outline">{parentesco_nome}</Badge>;
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "-";
    const cpfStr = cpf.toString().padStart(11, "0");
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateStr || "-";
    }
  };

  // Filtros já aplicados na query, não precisamos filtrar novamente
  const filteredDependents = dependents || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6 sm:h-8 sm:w-8" />
          Dependentes
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gerenciamento de dependentes dos associados FUNSEP
        </p>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Dependentes</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Busque e visualize informações dos dependentes. Use nome ou matrícula do titular para localizar registros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome ou matrícula do titular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === 1 ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(1)}
          >
            Ativos
          </Button>
          <Button
            variant={statusFilter === 3 ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 h-8"
            data-small-button
            onClick={() => setStatusFilter(3)}
          >
            Inativos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {hasSearched
              ? `Dependentes encontrados (${filteredDependents.length})`
              : "Digite no campo de busca para encontrar dependentes"}
            {filteredDependents.length === 100 && (
              <span className="text-xs sm:text-sm text-muted-foreground block mt-1">
                (máximo 100 resultados exibidos - refine sua busca se necessário)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            {!hasSearched ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Use o campo de busca acima para encontrar dependentes</p>
                <p className="text-sm">Digite nome ou matrícula do titular</p>
              </div>
            ) : loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              Array.isArray(filteredDependents) &&
              filteredDependents.map((dependent) => (
                <div
                  key={`${dependent.matricula}-${dependent.nrodep}`}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base leading-tight">{dependent.nome || "Nome não informado"}</h3>
                        {getStatusBadge(dependent.situacao)}
                        {getParentTypeBadge(dependent.parentesco_nome)}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDependent(dependent)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">Detalhes do Dependente</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PESSOAIS</h4>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Nome:</strong> {dependent.nome || '-'}
                                  </div>
                                  <div>
                                    <strong>CPF:</strong> {dependent.cpf ? formatCPF(dependent.cpf) : '-'}
                                  </div>
                                  <div>
                                    <strong>Data de Nascimento:</strong> {formatDate(dependent.dtnasc)}
                                  </div>
                                  <div>
                                    <strong>Sexo:</strong> {dependent.sexo || '-'}
                                  </div>
                                  <div>
                                    <strong>Nome da Mãe:</strong> {dependent.nomemae || '-'}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> {getStatusBadge(dependent.situacao)}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">DADOS DO TITULAR</h4>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Titular:</strong> {dependent.titular_nome || '-'}
                                  </div>
                                  <div>
                                    <strong>Matrícula:</strong> {dependent.matricula || '-'}
                                  </div>
                                  <div>
                                    <strong>Nº Dependente:</strong> {dependent.nrodep || '-'}
                                  </div>
                                  <div>
                                    <strong>Parentesco:</strong> {getParentTypeBadge(dependent.parentesco_nome)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {dependent.email && (
                              <div>
                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">CONTATO</h4>
                                <div className="space-y-2">
                                  <div>
                                    <strong>Email:</strong> {dependent.email}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div>
                        <strong>Titular:</strong> {dependent.titular_nome || "Não informado"} (Mat.{" "}
                        {dependent.matricula || "-"})
                      </div>
                      <div>
                        <strong>Nº Dependente:</strong> {dependent.nrodep || "-"}
                      </div>
                      <div>
                        <strong>CPF:</strong> {dependent.cpf ? formatCPF(dependent.cpf) : "-"}
                      </div>
                      <div>
                        <strong>Nascimento:</strong> {formatDate(dependent.dtnasc)}
                      </div>
                      <div>
                        <strong>Sexo:</strong> {dependent.sexo || "-"}
                      </div>
                      <div>
                        <strong>Mãe:</strong> {dependent.nomemae || "-"}
                      </div>
                    </div>

                    {dependent.email && (
                      <div className="text-xs sm:text-sm pt-2 border-t border-border/50">
                        <strong>Email:</strong> 
                        <span className="break-all ml-1">{dependent.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {hasSearched && (!Array.isArray(filteredDependents) || filteredDependents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dependente encontrado</p>
                <p className="text-sm">Tente ajustar os termos da busca</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
