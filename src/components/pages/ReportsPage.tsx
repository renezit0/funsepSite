import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Hash, Copy, Check, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { generatePDFFromHTML } from '@/utils/generatePDFFromHTML';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ViewReportByToken } from "./ViewReportByToken";

export function ReportsPage() {
  const { session } = useAuth();
  const ASSOCIADO_REPORT_TYPE: 'ir' = 'ir';
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [availableRegularYears, setAvailableRegularYears] = useState<number[]>([]);
  const [availableBoletoYears, setAvailableBoletoYears] = useState<number[]>([]);
  const [hasBoletoIr, setHasBoletoIr] = useState(false);
  const [irMode, setIrMode] = useState<'regular' | 'boleto'>('regular');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  /*
    LÓGICA ANTIGA (associado com todos os tipos):
    const [reportType, setReportType] = useState<'a_pagar' | 'pagos' | 'ir' | 'mensalidades'>('a_pagar');
    const [dateRange, setDateRange] = useState({
      dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Também existia loadAvailableYears() para 'mensalidades'
    // e renderização de botões para: a_pagar, pagos, ir, mensalidades.
  */
  const [htmlContent, setHtmlContent] = useState("");
  const [filename, setFilename] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const hasAvailableRegularData = availableRegularYears.length > 0;
  const hasAvailableBoletoData = availableBoletoYears.length > 0;
  const availableCalendarYears = irMode === 'boleto' ? availableBoletoYears : availableRegularYears;
  const hasAvailableIrData = availableCalendarYears.length > 0;

  const getEdgeFunctionFallbackMessage = async (error: unknown, defaultMessage: string) => {
    const errObj = error as { message?: string; context?: Response };
    const ctx = errObj?.context;

    if (ctx instanceof Response) {
      let backendMessage = '';
      try {
        const body = await ctx.clone().json();
        backendMessage = body?.error || body?.message || body?.details || '';
      } catch {
        try {
          backendMessage = await ctx.clone().text();
        } catch {
          backendMessage = '';
        }
      }

      if (ctx.status === 401 || ctx.status === 403) {
        return 'Sua sessão expirou ou você não tem permissão para gerar este relatório. Faça login novamente.';
      }
      if (ctx.status === 404) {
        return backendMessage || 'Não foram encontrados dados para este associado no ano selecionado.';
      }
      if (ctx.status >= 500) {
        return backendMessage || 'Falha interna ao processar o relatório no servidor. Tente novamente em instantes.';
      }
      return backendMessage || `Falha na função de relatório (HTTP ${ctx.status}).`;
    }

    const rawMessage = errObj?.message || String(error || '');
    if (rawMessage.includes('non-2xx status code')) {
      return 'A função de geração retornou erro, mas sem detalhe técnico. Verifique período/ano e tente novamente.';
    }

    return rawMessage || defaultMessage;
  };

  const formatIrYearLabel = (calendarYear: number) => {
    const exerciseYear = calendarYear + 1;
    return `${exerciseYear} (Ano calendário ${calendarYear})`;
  };

  useEffect(() => {
    const loadAvailableYears = async () => {
      const matricula = Number(session?.user?.matricula);
      if (!Number.isFinite(matricula)) {
        setAvailableRegularYears([]);
        setAvailableBoletoYears([]);
        setHasBoletoIr(false);
        setIrMode('regular');
        setSelectedYear(null);
        return;
      }

      setLoadingYears(true);

      try {
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            matricula,
            reportType: 'ir_years',
            geradoPorMatricula: session?.user?.matricula,
            geradoPorSigla: session?.sigla,
          }
        });

        if (error) throw error;

        const regularYears = Array.isArray(data?.anosRegular)
          ? data.anosRegular
              .map((year: number | string | null) => Number(year))
              .filter((year: number) => Number.isFinite(year) && year > 0)
              .sort((a: number, b: number) => b - a)
          : [];
        const boletoYears = Array.isArray(data?.anosBoleto)
          ? data.anosBoleto
              .map((year: number | string | null) => Number(year))
              .filter((year: number) => Number.isFinite(year) && year > 0)
              .sort((a: number, b: number) => b - a)
          : [];
        const hasBoleto = Boolean(data?.hasBoleto) || boletoYears.length > 0;
        const nextMode: 'regular' | 'boleto' = regularYears.length > 0 ? 'regular' : (boletoYears.length > 0 ? 'boleto' : 'regular');

        setAvailableRegularYears(regularYears);
        setAvailableBoletoYears(boletoYears);
        setHasBoletoIr(hasBoleto);
        setIrMode(nextMode);
        const yearsForMode = nextMode === 'boleto' ? boletoYears : regularYears;
        setSelectedYear(yearsForMode.length > 0 ? yearsForMode[0] : null);
      } catch (error: unknown) {
        console.error('Erro ao carregar anos de IR disponíveis:', error);
        setAvailableRegularYears([]);
        setAvailableBoletoYears([]);
        setHasBoletoIr(false);
        setIrMode('regular');
        setSelectedYear(null);
        mostrarFeedback('erro', 'Erro', 'Não foi possível carregar os anos disponíveis para IR');
      } finally {
        setLoadingYears(false);
      }
    };

    loadAvailableYears();
  }, [session?.user?.matricula, mostrarFeedback]);

  const generateReport = async () => {
    if (!session?.user?.matricula) {
      mostrarFeedback('erro', 'Erro', 'Você precisa estar logado para gerar relatórios');
      return;
    }
    if (!selectedYear) {
      mostrarFeedback('erro', 'Erro', 'Nenhum ano disponível para gerar a declaração de IR');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          matricula: session.user.matricula,
          dataInicio: `${selectedYear}-01-01`,
          dataFim: `${selectedYear}-12-31`,
          reportType: ASSOCIADO_REPORT_TYPE,
          irMode,
          /*
            LÓGICA ANTIGA:
            dataInicio: reportType === 'ir' || reportType === 'mensalidades' ? `${selectedYear}-01-01` : dateRange.dataInicio,
            dataFim: reportType === 'ir' || reportType === 'mensalidades' ? `${selectedYear}-12-31` : dateRange.dataFim,
            reportType: reportType,
          */
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
      const fallbackMessage = await getEdgeFunctionFallbackMessage(error, 'Erro ao gerar relatório');
      mostrarFeedback('erro', 'Erro', fallbackMessage);
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
    const copyWithFallback = (text: string) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copiedByCommand = document.execCommand('copy');
      document.body.removeChild(textArea);
      return copiedByCommand;
    };

    const doCopy = async () => {
      if (!generatedToken) return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(generatedToken);
        } else {
          const copied = copyWithFallback(generatedToken);
          if (!copied) throw new Error('Falha ao copiar token');
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        mostrarToast('sucesso', 'Token copiado para a área de transferência!');
      } catch (error) {
        const copied = copyWithFallback(generatedToken);
        if (copied) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          mostrarToast('sucesso', 'Token copiado para a área de transferência!');
          return;
        }

        console.error('Erro ao copiar token:', error);
        mostrarFeedback('erro', 'Erro', 'Não foi possível copiar o token automaticamente');
      }
    };

    void doCopy();
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
              {/* LÓGICA ANTIGA:
                  grid com 4 botões:
                  - Procedimentos a Pagar
                  - Procedimentos Pagos
                  - Declaração IR
                  - Mensalidades
                  com setReportType(...) e estilos por tipo.
              */}
              <div className={`grid gap-2 sm:gap-3 ${hasBoletoIr ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Button
                  variant={irMode === 'regular' ? "default" : "outline"}
                  type="button"
                  className={`h-auto py-3 sm:py-4 ${irMode === 'regular' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  disabled={!hasAvailableRegularData}
                  onClick={() => {
                    setIrMode('regular');
                    setSelectedYear(availableRegularYears[0] ?? null);
                  }}
                >
                  <div className="text-center w-full">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                    <div className="text-xs sm:text-sm font-medium">Declaração IR</div>
                  </div>
                </Button>
                {hasBoletoIr && (
                  <Button
                    variant={irMode === 'boleto' ? "default" : "outline"}
                    type="button"
                    className={`h-auto py-3 sm:py-4 ${irMode === 'boleto' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                    disabled={!hasAvailableBoletoData}
                    onClick={() => {
                      setIrMode('boleto');
                      setSelectedYear(availableBoletoYears[0] ?? null);
                    }}
                  >
                    <div className="text-center w-full">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1.5 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">IRPF Boletos</div>
                    </div>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano">Ano de Referência</Label>
                <Select
                  value={selectedYear?.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                  disabled={loadingYears || !hasAvailableIrData}
                >
                  <SelectTrigger id="ano">
                    <SelectValue placeholder={loadingYears ? "Carregando anos..." : "Sem anos disponíveis"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCalendarYears.map(calendarYear => (
                      <SelectItem key={calendarYear} value={calendarYear.toString()}>
                        {formatIrYearLabel(calendarYear)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* LÓGICA ANTIGA:
                  Se reportType === 'ir' || reportType === 'mensalidades':
                  - mostrava seletor de ano (mensalidades usava availableYears)
                  Senão:
                  - mostrava dataInicio/dataFim (dateRange) para a_pagar/pagos
              */}

                <Button
                  onClick={generateReport}
                  disabled={loading || loadingYears || !hasAvailableIrData || !selectedYear}
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
