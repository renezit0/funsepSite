import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, FileText, User, Calendar, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportInfo {
  matricula: number;
  nome_beneficiario: string;
  cpf_beneficiario: string;
  tipo_relatorio: string;
  data_inicio: string;
  data_fim: string;
  gerado_em: string;
  visualizacoes: number;
  ultima_visualizacao: string;
  gerado_por?: {
    nome: string;
    sigla: string;
    cargo: string;
  } | null;
}

export function ViewReportByToken() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [filename, setFilename] = useState("");
  const { mostrarToast, mostrarFeedback } = useFeedback();

  const formatCPF = (cpf: string | number) => {
    const cpfStr = cpf.toString().padStart(11, '0');
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD format correctly
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const getTipoRelatorioLabel = (tipo: string) => {
    switch (tipo) {
      case 'a_pagar': return 'Procedimentos a Pagar';
      case 'pagos': return 'Procedimentos Pagos';
      case 'ir': return 'Declaração IR';
      default: return tipo;
    }
  };

  const viewReport = async () => {
    if (!token.trim()) {
      mostrarFeedback('aviso', 'Atenção', 'Por favor, informe o token do relatório');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('view-report', {
        body: {},
        method: 'GET',
      });

      // Construir URL manualmente com o token
      const supabaseUrl = 'https://akjwxhidgbrrtfzqucln.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrand4aGlkZ2JycnRmenF1Y2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODM0MTIsImV4cCI6MjA3Mjg1OTQxMn0.7bfCxFiWLaxGfe8A1ZSbHxV_hiSP8eYZCCX5GX7qxvw';
      
      const url = `${supabaseUrl}/functions/v1/view-report?token=${encodeURIComponent(token)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar relatório');
      }

      const data2 = await response.json();

      setHtmlContent(data2.html);
      setFilename(data2.filename);
      setReportInfo(data2.info);

      mostrarToast('sucesso', 'Relatório carregado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao visualizar relatório:', error);
      mostrarFeedback('erro', 'Erro', error.message || 'Erro ao carregar relatório. Verifique o token e tente novamente.');
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualizar Relatório por Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token">Token do Relatório</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Digite o token do relatório"
                className="font-mono"
              />
              <Button onClick={viewReport} disabled={loading}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </div>

          {reportInfo && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Relatório</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Beneficiário</div>
                    <div className="font-medium">{reportInfo.nome_beneficiario}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">CPF</div>
                    <div className="font-mono">{formatCPF(reportInfo.cpf_beneficiario)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Matrícula</div>
                    <div className="font-mono">{reportInfo.matricula}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Tipo</div>
                    <Badge variant="outline">{getTipoRelatorioLabel(reportInfo.tipo_relatorio)}</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Período</div>
                    <div className="text-sm">
                      {formatDate(reportInfo.data_inicio)} até {formatDate(reportInfo.data_fim)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Gerado em</div>
                    <div className="text-sm">{formatDateTime(reportInfo.gerado_em)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Visualizações</div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{reportInfo.visualizacoes}</span>
                    </div>
                  </div>

                  {reportInfo.gerado_por && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Gerado por</div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {reportInfo.gerado_por.nome} ({reportInfo.gerado_por.sigla})
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {reportInfo.gerado_por.cargo}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadPDF} disabled={loading} className="w-full md:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
