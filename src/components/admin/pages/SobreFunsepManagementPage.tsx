import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { SobreFunsepModal } from "@/components/modals/SobreFunsepModal";

interface SobreFunsepSecao {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  ordem: number;
  publicado: boolean;
  updated_at: string;
  atualizado_por_sigla: string | null;
}

export function SobreFunsepManagementPage() {
  const [secoes, setSecoes] = useState<SobreFunsepSecao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSecao, setEditingSecao] = useState<SobreFunsepSecao | null>(null);

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-48 rounded"></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="skeleton-shimmer h-6 w-16 rounded"></div>
            <div className="skeleton-shimmer h-6 w-20 rounded"></div>
            <div className="skeleton-shimmer h-4 w-24 rounded"></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <div className="skeleton-shimmer h-8 w-32 rounded"></div>
          <div className="skeleton-shimmer h-8 w-32 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonRow = () => (
    <TableRow>
      <TableCell><div className="skeleton-shimmer h-4 w-8 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-6 w-20 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
        </div>
      </TableCell>
    </TableRow>
  );

  useEffect(() => {
    loadSecoes();
  }, []);

  const loadSecoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sobre_funsep")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar seções");
      console.error("Erro:", error);
    } else {
      setSecoes(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (secao: SobreFunsepSecao) => {
    setEditingSecao(secao);
    setIsModalOpen(true);
  };

  const togglePublish = async (secao: SobreFunsepSecao) => {
    const { error } = await supabase
      .from("sobre_funsep")
      .update({ 
        publicado: !secao.publicado,
        updated_at: new Date().toISOString()
      })
      .eq("id", secao.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error("Erro:", error);
    } else {
      toast.success(`Seção ${!secao.publicado ? "publicada" : "ocultada"} com sucesso`);
      loadSecoes();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSecao(null);
  };

  const handleSuccess = () => {
    loadSecoes();
    handleModalClose();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sobre o FUNSEP</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie o conteúdo das seções sobre o FUNSEP
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Conteúdo</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Edite e publique as seções informativas sobre o FUNSEP, incluindo histórico, missão e valores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Seções do Sobre o FUNSEP ({secoes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          {loading ? (
            <>
          {/* Desktop Table Skeleton */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead>Atualizado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards Skeleton */}
          <div className="lg:hidden space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
            </>
          ) : (
            <>
          {/* Desktop Table - apenas em telas grandes */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead>Atualizado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secoes.map((secao) => (
                  <TableRow key={secao.id}>
                    <TableCell>{secao.ordem}</TableCell>
                    <TableCell className="font-medium">{secao.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={secao.publicado ? "default" : "secondary"}>
                        {secao.publicado ? "Publicado" : "Oculto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(secao.updated_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{secao.atualizado_por_sigla || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublish(secao)}
                            >
                              {secao.publicado ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{secao.publicado ? 'Ocultar' : 'Publicar'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(secao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards para Mobile e Tablet */}
          <div className="lg:hidden space-y-3">
            {secoes.map((secao) => (
              <Card key={secao.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{secao.titulo}</h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Ordem: {secao.ordem}
                      </Badge>
                      <Badge variant={secao.publicado ? "default" : "secondary"} className="text-xs">
                        {secao.publicado ? "Publicado" : "Oculto"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(secao.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    
                    {secao.atualizado_por_sigla && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Atualizado por: {secao.atualizado_por_sigla}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(secao)}
                      className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                    >
                      {secao.publicado ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {secao.publicado ? 'Ocultar' : 'Publicar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(secao)}
                      className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          )}
        </CardContent>
      </Card>

      <SobreFunsepModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editingSecao={editingSecao}
      />
    </div>
  );
}
