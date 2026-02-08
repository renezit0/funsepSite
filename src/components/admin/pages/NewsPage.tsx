import React, { useState, useEffect } from "react";
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Search, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { NewsModal } from "@/components/modals/NewsModal";
import { NewsPreviewModal } from "@/components/modals/NewsPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  publicado: boolean;
  data_publicacao: string | null;
  created_at: string;
  updated_at: string;
  autor_sigla: string;
  imagem_url: string | null;
}

export function NewsPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<Noticia | null>(null);
  const [previewNews, setPreviewNews] = useState<Noticia | null>(null);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-48 rounded"></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="skeleton-shimmer h-6 w-20 rounded"></div>
            <div className="skeleton-shimmer h-6 w-16 rounded"></div>
            <div className="skeleton-shimmer h-4 w-24 rounded"></div>
          </div>
          <div className="skeleton-shimmer h-4 w-32 rounded"></div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <div className="skeleton-shimmer h-8 w-24 rounded"></div>
          <div className="skeleton-shimmer h-8 w-28 rounded"></div>
          <div className="skeleton-shimmer h-8 w-20 rounded"></div>
          <div className="skeleton-shimmer h-8 w-20 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  const SkeletonRow = () => (
    <TableRow>
      <TableCell><div className="skeleton-shimmer h-4 w-64 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-6 w-20 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-6 w-20 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
          <div className="skeleton-shimmer h-8 w-8 rounded"></div>
        </div>
      </TableCell>
    </TableRow>
  );

  const loadNoticias = async () => {
    try {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNoticias(data || []);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      mostrarFeedback('erro', 'Erro', 'Falha ao carregar notícias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNoticias();
  }, []);

  const handleEdit = (noticia: Noticia) => {
    setEditingNews(noticia);
    setIsModalOpen(true);
  };

  const handlePreview = (noticia: Noticia) => {
    setPreviewNews(noticia);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('noticias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      mostrarToast('sucesso', 'Notícia excluída com sucesso!');

      loadNoticias();
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      mostrarFeedback('erro', 'Erro', 'Falha ao excluir notícia');
    }
  };

  const togglePublish = async (noticia: Noticia) => {
    try {
      const newPublishedState = !noticia.publicado;
      const { error } = await supabase
        .from('noticias')
        .update({ 
          publicado: newPublishedState,
          data_publicacao: newPublishedState ? new Date().toISOString() : null
        })
        .eq('id', noticia.id);

      if (error) throw error;

      mostrarToast('sucesso', `Notícia ${newPublishedState ? 'publicada' : 'despublicada'} com sucesso!`);

      loadNoticias();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      mostrarFeedback('erro', 'Erro', 'Falha ao alterar status da notícia');
    }
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Saúde': 'bg-primary',
      'Informativo': 'bg-blue-500',
      'Benefícios': 'bg-green-500',
      'Tecnologia': 'bg-purple-500',
      'Geral': 'bg-gray-500'
    };
    return colors[categoria] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            Notícias
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerenciamento de notícias e comunicados
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingNews(null);
            setIsModalOpen(true);
          }}
          className="gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span className="sm:inline">Nova Notícia</span>
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Gerenciamento de Notícias</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Crie, edite e publique notícias para os associados. Gerencie categorias e status de publicação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Lista de Notícias ({noticias.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          {loading ? (
            <>
              {/* Desktop Table Skeleton */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Autor</TableHead>
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
          ) : noticias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma notícia encontrada</p>
            </div>
          ) : (
            <>
              {/* Desktop Table - apenas em telas grandes */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {noticias.map((noticia) => (
                      <TableRow key={noticia.id}>
                        <TableCell className="font-medium">
                          {noticia.titulo}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getCategoryColor(noticia.categoria)} text-white`}>
                            {noticia.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={noticia.publicado ? "default" : "secondary"}>
                            {noticia.publicado ? "Publicado" : "Rascunho"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{format(new Date(noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {noticia.updated_at && noticia.updated_at !== noticia.created_at && (
                              <span className="text-xs text-muted-foreground/50 italic">
                                editado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{noticia.autor_sigla}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreview(noticia)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visualizar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => togglePublish(noticia)}
                                >
                                  {noticia.publicado ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{noticia.publicado ? 'Despublicar' : 'Publicar'}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(noticia)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Excluir</TooltipContent>
                                </Tooltip>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-4">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                  <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(noticia.id)} className="w-full sm:w-auto m-0">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards para Mobile e Tablet */}
              <div className="lg:hidden space-y-3">
                {noticias.map((noticia) => (
                  <Card key={noticia.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate">{noticia.titulo}</h3>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${getCategoryColor(noticia.categoria)} text-white text-xs`}>
                            {noticia.categoria}
                          </Badge>
                          <Badge variant={noticia.publicado ? "default" : "secondary"} className="text-xs">
                            {noticia.publicado ? "Publicado" : "Rascunho"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {noticia.updated_at && noticia.updated_at !== noticia.created_at && (
                            <span className="text-xs text-muted-foreground/50 italic">
                              editado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Autor: {noticia.autor_sigla}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(noticia)}
                          className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                        >
                          <Search className="h-3.5 w-3.5" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublish(noticia)}
                          className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                        >
                          {noticia.publicado ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {noticia.publicado ? 'Despublicar' : 'Publicar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(noticia)}
                          className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 min-w-[calc(50%-0.25rem)] gap-1 h-8 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                              <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(noticia.id)} className="w-full sm:w-auto m-0">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <NewsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNews(null);
        }}
        onSuccess={loadNoticias}
        editingNews={editingNews}
      />

      <NewsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewNews(null);
        }}
        noticia={previewNews}
      />
    </div>
  );
}