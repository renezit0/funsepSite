import React, { useState, useEffect } from "react";
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Search } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Notícias
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de notícias e comunicados
          </p>
        </div>
        <Button onClick={() => {
          setEditingNews(null);
          setIsModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Notícia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Notícias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : noticias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma notícia encontrada
            </div>
          ) : (
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
                          <span className="text-xs text-amber-600">
                            (editado em {format(new Date(noticia.updated_at), "dd/MM/yyyy", { locale: ptBR })})
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
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(noticia.id)}>
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