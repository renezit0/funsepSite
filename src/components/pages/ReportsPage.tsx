import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Hash, Copy, Check, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { generatePDFFromHTML } from '@/utils/generatePDFFromHTML';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ViewReportByToken } from "./ViewReportByToken";

export function ReportsPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'a_pagar' | 'pagos' | 'ir' | 'mensalidades'>('a_pagar');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [dateRange, setDateRange] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [filename, setFilename] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  // Reset selectedYear when reportType changes
  useEffect(() => {
    if (reportType === 'ir' || reportType === 'mensalidades') {
      setSelectedYear(new Date().getFullYear() - 1);
      if (reportType === 'mensalidades') {
        loadAvailableYears();
      }
    }
  }, [reportType]);

  const loadAvailableYears = async () => {
    if (!session?.user?.matricula) return;

    try {
      const { data, error } = await supabase
        .from('relmensanual')
        .select('ano')
        .eq('matfuns', session.user.matricula)
        .order('ano', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const years = [...new Set(data.map(item => item.ano))].sort((a, b) => b - a);
        setAvailableYears(years);
        if (years.length > 0 && !years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        setAvailableYears([]);
      }
    } catch (error) {
      console.error('Erro ao carregar anos disponíveis:', error);
      setAvailableYears([]);
    }
  };

  const generateReport = async () => {
    if (!session?.user?.matricula) {
      mostrarFeedback('erro', 'Erro', 'Você precisa estar logado para gerar relatórios');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          matricula: session.user.matricula,
          dataInicio: reportType === 'ir' || reportType === 'mensalidades' ? `${selectedYear}-01-01` : dateRange.dataInicio,
          dataFim: reportType === 'ir' || reportType === 'mensalidades' ? `${selectedYear}-12-31` : dateRange.dataFim,
          reportType: reportType,
          geradoPorMatricula: session.user.matricula,
          geradoPorSigla: session.sigla,
        }
      });

      if (error) throw error;

      setHtmlContent(data.html);
      setFilename(data.filename);
      setGeneratedToken(data.token);
      setTokenModalOpen(true);

      mostrarToast('sucesso', 'Relatório gerado com sucesso!');
    } catch (error: unknown) {
      console.error('Erro ao gerar relatório:', error);
      if (error instanceof Error) {
        mostrarFeedback('erro', 'Erro', error.message || 'Erro ao gerar relatório');
      } else {
        mostrarFeedback('erro', 'Erro', 'Erro ao gerar relatório');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!htmlContent) return;

    setLoading(true);

    try {
      await generatePDFFromHTML({ htmlContent, filename });
      mostrarToast('sucesso', 'PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      mostrarToast('sucesso', 'Token copiado para a área de transferência!');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Relatórios
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Gere seus relatórios ou visualize por token
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="gerar" className="w-full">
        <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-2 p-0 gap-0 bg-transparent border border-border rounded-md overflow-hidden" style={{ height: '44px' }}>
          <TabsTrigger value="gerar" className="text-xs sm:text-sm px-4 rounded-l-md rounded-r-none flex items-center justify-center bg-background hover:bg-background border-r border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" style={{ paddingTop: 0, paddingBottom: 0, height: '44px', minHeight: '44px' }}>Gerar Relatório</TabsTrigger>
          <TabsTrigger value="validar" className="text-xs sm:text-sm px-4 rounded-r-md rounded-l-none flex items-center justify-center bg-background hover:bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm" style={{ paddingTop: 0, paddingBottom: 0, height: '44px', minHeight: '44px' }}>Validar Token</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="mt-6">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Relatório</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <Button
                    variant={reportType === 'a_pagar' ? 'default' : 'outline'}
                    onClick={() => setReportType('a_pagar')}
                    className={`h-auto py-3 sm:py-4 ${
                      reportType === 'a_pagar'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    <div className="text-center w-full">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">Procedimentos a Pagar</div>
                    </div>
                  </Button>
                  <Button
                    variant={reportType === 'pagos' ? 'default' : 'outline'}
                    onClick={() => setReportType('pagos')}
                    className={`h-auto py-3 sm:py-4 ${
                      reportType === 'pagos'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center w-full">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">Procedimentos Pagos</div>
                    </div>
                  </Button>
                  <Button
                    variant={reportType === 'ir' ? 'default' : 'outline'}
                    onClick={() => setReportType('ir')}
                    className={`h-auto py-3 sm:py-4 ${
                      reportType === 'ir'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-center w-full">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">Declaração IR</div>
                    </div>
                  </Button>
                  <Button
                    variant={reportType === 'mensalidades' ? 'default' : 'outline'}
                    onClick={() => setReportType('mensalidades')}
                    className={`h-auto py-3 sm:py-4 ${
                      reportType === 'mensalidades'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <div className="text-center w-full">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">Mensalidades</div>
                    </div>
                  </Button>
                </div>

                {reportType === 'ir' || reportType === 'mensalidades' ? (
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano de Referência</Label>
                    {reportType === 'mensalidades' && availableYears.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                        Nenhum ano com mensalidades disponível.
                      </div>
                    ) : (
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                      >
                        <SelectTrigger id="ano">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reportType === 'mensalidades'
                            ? availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))
                            : Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    )}
                    {reportType === 'mensalidades' && availableYears.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione o ano para gerar a relação de mensalidades de janeiro a dezembro.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio">Data Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={dateRange.dataInicio}
                        onChange={(e) => setDateRange({ ...dateRange, dataInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataFim">Data Fim (opcional)</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={dateRange.dataFim}
                        onChange={(e) => setDateRange({ ...dateRange, dataFim: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={generateReport}
                  disabled={loading || (reportType === 'mensalidades' && availableYears.length === 0)}
                  className="w-full gap-2"
                >
                  {loading ? "Gerando..." : <><Download className="h-4 w-4" /> Gerar Relatório</>}
                </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validar" className="mt-6">
          <ViewReportByToken />
        </TabsContent>
      </Tabs>

      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5" />
              Token do Relatório Gerado
            </DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use este token para visualizar o relatório posteriormente:
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <code className="flex-1 text-sm font-mono break-all">
                  {generatedToken}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyTokenToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button onClick={() => setTokenModalOpen(false)} variant="outline" className="w-full sm:w-auto">
                  Fechar
                </Button>
                <Button onClick={downloadPDF} disabled={loading} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
