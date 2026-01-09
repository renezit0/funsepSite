import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import 'react-quill/dist/quill.snow.css';

interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  imagem_url: string | null;
  data_publicacao: string;
  created_at: string;
}

export function NewsPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);

  useEffect(() => {
    loadNoticias();
  }, []);

  const loadNoticias = async () => {
    try {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicado', true)
        .order('data_publicacao', { ascending: false });

      if (error) throw error;
      setNoticias(data || []);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">Carregando notícias...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visualização de notícia individual
  if (selectedNoticia) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedNoticia(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para notícias
        </Button>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Badge className={`${getCategoryColor(selectedNoticia.categoria)} text-white`}>
                {selectedNoticia.categoria}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Publicado em {format(new Date(selectedNoticia.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              {selectedNoticia.titulo}
            </h1>
            
            <div 
              className="ql-editor prose prose-lg max-w-none dark:prose-invert
                prose-headings:text-foreground 
                prose-p:text-foreground/90 
                prose-a:text-primary 
                prose-strong:text-foreground
                prose-ul:text-foreground/90
                prose-ol:text-foreground/90
                [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border
                [&_td]:border [&_td]:border-border [&_td]:p-2
                [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4
                mb-6"
              dangerouslySetInnerHTML={{ __html: selectedNoticia.conteudo }}
            />
            
            {selectedNoticia.imagem_url && (
              <img
                src={selectedNoticia.imagem_url}
                alt={selectedNoticia.titulo}
                className="w-full h-auto rounded-lg mt-6"
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de notícias
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            Notícias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {noticias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma notícia publicada no momento.
            </div>
          ) : (
            <div className="space-y-6">
              {noticias.map((noticia) => (
                <Card key={noticia.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Badge className={`${getCategoryColor(noticia.categoria)} text-white`}>
                        {noticia.categoria}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(noticia.data_publicacao), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                      {noticia.titulo}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {noticia.resumo}
                    </p>
                    
                    {noticia.imagem_url && (
                      <div className="mb-4">
                        <img
                          src={noticia.imagem_url}
                          alt={noticia.titulo}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary"
                      onClick={() => setSelectedNoticia(noticia)}
                    >
                      Leia mais
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}