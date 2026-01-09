import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import 'react-quill/dist/quill.snow.css';

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

interface NewsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  noticia: Noticia | null;
}

export function NewsPreviewModal({ isOpen, onClose, noticia }: NewsPreviewModalProps) {
  if (!noticia) return null;

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

  const wasEdited = noticia.updated_at && noticia.updated_at !== noticia.created_at;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Pré-visualização da Notícia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Header info */}
          <div className="flex flex-wrap items-center gap-4">
            <Badge className={`${getCategoryColor(noticia.categoria)} text-white`}>
              {noticia.categoria}
            </Badge>
            <Badge variant={noticia.publicado ? "default" : "secondary"}>
              {noticia.publicado ? "Publicado" : "Rascunho"}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground">
            {noticia.titulo}
          </h1>

          {/* Dates and author */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Cadastrado em {format(new Date(noticia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {wasEdited && (
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="h-4 w-4" />
                <span>
                  Editado em {format(new Date(noticia.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Por {noticia.autor_sigla}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-muted-foreground italic">
              {noticia.resumo}
            </p>
          </div>

          {/* Content */}
          <div 
            className="ql-editor prose prose-lg max-w-none dark:prose-invert
              prose-headings:text-foreground 
              prose-p:text-foreground/90 
              prose-a:text-primary 
              prose-strong:text-foreground
              prose-ul:text-foreground/90
              prose-ol:text-foreground/90
              prose-table:border-collapse
              prose-td:border prose-td:border-border prose-td:p-2
              prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted
              [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border
              [&_td]:border [&_td]:border-border [&_td]:p-2
              [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
            dangerouslySetInnerHTML={{ __html: noticia.conteudo }}
          />

          {/* Image */}
          {noticia.imagem_url && (
            <div className="mt-6">
              <img
                src={noticia.imagem_url}
                alt={noticia.titulo}
                className="w-full h-auto rounded-lg border"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
