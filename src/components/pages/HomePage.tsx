import { useState, useEffect } from "react";
import { Hospital, ArrowRight, Calendar, Building2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import 'react-quill/dist/quill.snow.css';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  imagem_url: string | null;
  data_publicacao: string | null;
  created_at: string;
  updated_at: string;
  secao?: string;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNoticias();
  }, []);

  const loadNoticias = async () => {
    try {
      const { data, error } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicado', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Erro ao carregar notícias:', error);
        throw error;
      }
      setNoticias(data || []);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoading(false);
    }
  };

  const SkeletonCard = () => (
    <div className="noticia-card">
      <div className="noticia-card-content">
        <div className="noticia-card-header">
          <div className="skeleton-shimmer h-6 w-20 rounded"></div>
          <div className="skeleton-shimmer h-4 w-24 rounded"></div>
        </div>
        <div className="skeleton-shimmer h-12 w-full rounded"></div>
        <div className="space-y-2">
          <div className="skeleton-shimmer h-4 w-full rounded"></div>
          <div className="skeleton-shimmer h-4 w-full rounded"></div>
          <div className="skeleton-shimmer h-4 w-3/4 rounded"></div>
        </div>
        <div className="skeleton-shimmer h-4 w-20 rounded"></div>
      </div>
    </div>
  );

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
    <div className="space-y-8" style={{ maxWidth: '100%', width: '100%' }}>
      {/* Latest News Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hospital className="h-6 w-6 text-primary" />
              </div>
              Últimas Notícias
            </CardTitle>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => onNavigate("news")}
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="noticias-grid">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : noticias.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Nenhuma notícia disponível no momento.
              </div>
            ) : (
              noticias.map((noticia) => (
                <div key={noticia.id} className="noticia-card">
                  <div className="noticia-card-content">
                    <div className="noticia-card-header">
                      <Badge className={`${getCategoryColor(noticia.categoria)} text-white text-xs`}>
                        {noticia.categoria}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(noticia.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <h3 className="noticia-card-titulo">
                      {noticia.titulo}
                    </h3>
                    <p className="noticia-card-resumo">
                      {noticia.resumo}
                    </p>
                    <Dialog open={selectedNoticia?.id === noticia.id} onOpenChange={(open) => !open && setSelectedNoticia(null)}>
                      <div className="flex">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary font-semibold text-sm inline-flex items-center gap-1.5 hover:gap-2.5 transition-all"
                          onClick={() => setSelectedNoticia(noticia)}
                        >
                          Leia mais
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[90vw] md:max-w-4xl max-h-[85vh] p-0 gap-0 overflow-y-auto">
                        <div className="p-4 sm:p-6">
                          <DialogHeader className="space-y-3 sm:space-y-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getCategoryColor(noticia.categoria)} text-white text-xs sm:text-sm`}>
                                {noticia.categoria}
                              </Badge>
                            </div>
                            <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight pr-8">
                              {noticia.titulo}
                            </DialogTitle>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground border-b pb-3 sm:pb-4">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="break-words">Publicado em {format(new Date(noticia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              </div>
                              {noticia.secao && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>Por {noticia.secao}</span>
                                </div>
                              )}
                            </div>
                          </DialogHeader>

                          <div className="space-y-4 sm:space-y-6">
                          <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                            <p className="text-muted-foreground italic text-sm sm:text-base leading-relaxed">
                              {noticia.resumo}
                            </p>
                          </div>

                          <div
                            className="prose prose-sm sm:prose-base max-w-none dark:prose-invert
                              prose-headings:text-foreground
                              prose-p:text-foreground/90
                              prose-a:text-primary
                              prose-strong:text-foreground
                              prose-ul:text-foreground/90
                              prose-ol:text-foreground/90
                              [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border
                              [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-sm
                              [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-sm
                              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4"
                            dangerouslySetInnerHTML={{ __html: noticia.conteudo }}
                          />

                          {noticia.imagem_url && (
                            <div className="mt-4 sm:mt-6">
                              <img
                                src={noticia.imagem_url}
                                alt={noticia.titulo}
                                className="w-full max-w-full h-auto rounded-lg object-contain"
                                style={{ maxHeight: '600px' }}
                              />
                            </div>
                          )}

                            {noticia.updated_at && noticia.updated_at !== noticia.created_at && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-amber-600 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="break-words">Editado em {format(new Date(noticia.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sobre Nós Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            Sobre Nós
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-full md:w-64">
              <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-border">
                <img
                  src="/images/funsep-atendimento.jpg"
                  alt="FUNSEP Atendimento"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm md:text-base text-primary font-semibold leading-relaxed bg-primary/5 border-l-4 border-primary p-4 rounded-r">
                O Funsep é uma instituição que existe para dar assistência à saúde dos servidores do Poder Judiciário e seus dependentes.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify">
                O Fundo foi criado em <strong className="text-primary font-semibold">1983</strong>, por um decreto da Presidência do Tribunal de Justiça. A sua administração é feita por um Conselho Diretor do qual fazem parte quatro servidores.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify">
                Com um quadro próprio de funcionários, o Funsep está instalado no <strong className="text-primary font-semibold">Centro Cívico</strong>, na rua <strong className="text-primary font-semibold">Papa João XXIII, 244</strong>.
              </p>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify">
                Desde o dia <strong className="text-primary font-semibold">1º de março de 2006</strong>, o atendimento está sendo feito pelo sistema <strong className="text-primary font-semibold">Unimed</strong>, que atinge todo o território do País.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
