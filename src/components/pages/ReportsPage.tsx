import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Hash, Copy, Check, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ViewReportByToken } from "./ViewReportByToken";

export function ReportsPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'a_pagar' | 'pagos' | 'ir'>('a_pagar');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [dateRange, setDateRange] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: ''
  });
  const [htmlContent, setHtmlContent] = useState("");
  const [filename, setFilename] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

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
          dataInicio: reportType === 'ir' ? `${selectedYear}-01-01` : dateRange.dataInicio,
          dataFim: reportType === 'ir' ? `${selectedYear}-12-31` : dateRange.dataFim,
          reportType: reportType,
          geradoPorMatricula: session.user.matricula,
          geradoPorSigla: session.sigla,
        },
      });

      if (error) throw error;

      setHtmlContent(data.html);
      setFilename(data.filename);
      setGeneratedToken(data.token);
      setTokenModalOpen(true);

      mostrarToast('sucesso', 'Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      mostrarFeedback('erro', 'Erro', error.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!htmlContent) return;

    setLoading(true);

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '794px';
      tempDiv.style.maxWidth = '794px';
      tempDiv.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempDiv);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: Math.max(1123, tempDiv.scrollHeight),
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const marginLeft = 15;
      const marginTop = 15;
      const marginRight = 15;
      const marginBottom = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const contentHeight = pageHeight - marginTop - marginBottom;
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = marginTop;
      let page = 0;

      pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + marginTop;
        pdf.addPage();
        page++;
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= contentHeight;
      }

      pdf.save(filename);

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-2">
            Gere seus relatórios ou visualize por token
          </p>
        </div>

        <Tabs defaultValue="gerar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gerar">Gerar Relatório</TabsTrigger>
            <TabsTrigger value="validar">Validar Token</TabsTrigger>
          </TabsList>

          <TabsContent value="gerar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={reportType === 'a_pagar' ? 'default' : 'outline'}
                    onClick={() => setReportType('a_pagar')}
                    className="h-20"
                  >
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <div>A Pagar</div>
                    </div>
                  </Button>
                  <Button
                    variant={reportType === 'pagos' ? 'default' : 'outline'}
                    onClick={() => setReportType('pagos')}
                    className="h-20"
                  >
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <div>Pagos</div>
                    </div>
                  </Button>
                  <Button
                    variant={reportType === 'ir' ? 'default' : 'outline'}
                    onClick={() => setReportType('ir')}
                    className="h-20"
                  >
                    <div className="text-center">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <div>Declaração IR</div>
                    </div>
                  </Button>
                </div>

                {reportType === 'ir' ? (
                  <div className="space-y-2">
                    <Label>Ano de Referência</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-md"
                        value={dateRange.dataInicio}
                        onChange={(e) => setDateRange({ ...dateRange, dataInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim (opcional)</Label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-md"
                        value={dateRange.dataFim}
                        onChange={(e) => setDateRange({ ...dateRange, dataFim: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={generateReport} disabled={loading} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>

                {htmlContent && (
                  <Button onClick={downloadPDF} disabled={loading} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validar">
            <ViewReportByToken />
          </TabsContent>
        </Tabs>

        <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
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
              <div className="flex gap-2">
                <Button onClick={downloadPDF} disabled={loading} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button onClick={() => setTokenModalOpen(false)} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
