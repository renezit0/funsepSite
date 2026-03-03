import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, FileText, User, Calendar, Hash, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { generatePDFFromHTML } from '@/utils/generatePDFFromHTML';
import { useLocation, useParams } from "react-router-dom";

interface ReportInfo {
  matricula: number;
  nome_beneficiario: string;
  cpf_beneficiario: string;
  tipo_relatorio: string;
  data_inicio: string;
  data_fim: string;
  valor_total_centavos: number;
  valor_total_formatado: string;
  detalhes_relatorio?: Record<string, unknown>;
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
  const { token: routeToken } = useParams<{ token: string }>();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [filename, setFilename] = useState("");
  const { mostrarToast, mostrarFeedback } = useFeedback();
  const [autoLoadedByLink, setAutoLoadedByLink] = useState(false);

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

  useEffect(() => {
    if (autoLoadedByLink) return;

    const params = new URLSearchParams(location.search);
    const queryToken = params.get('token') || params.get('') || '';
    const incomingToken = (routeToken || queryToken || '').trim();

    if (!incomingToken) return;

    setToken(incomingToken);
    setAutoLoadedByLink(true);
  }, [routeToken, location.search, autoLoadedByLink]);

  useEffect(() => {
    if (!autoLoadedByLink || !token.trim()) return;
    void viewReport();
  }, [autoLoadedByLink, token]);

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

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          Insira o Token de Validação
        </CardTitle>
      </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token do Relatório</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Digite o token do relatório"
                  className="font-mono text-sm flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && viewReport()}
                />
                <Button
                  onClick={viewReport}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? 'Buscando...' : 'Visualizar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O token é fornecido junto com o relatório gerado. Cole o código completo no campo acima.
              </p>
            </div>

            {reportInfo && (
              <>
                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">Informações do Relatório</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/50">
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Beneficiário</div>
                      <div className="font-semibold text-foreground">{reportInfo.nome_beneficiario}</div>
                    </div>

                    <div className="p-4 rounded-lg border border-purple-100 bg-purple-50/50">
                      <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-2">CPF</div>
                      <div className="font-mono text-foreground font-semibold">{formatCPF(reportInfo.cpf_beneficiario)}</div>
                    </div>

                    <div className="p-4 rounded-lg border border-green-100 bg-green-50/50">
                      <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-2">Matrícula</div>
                      <div className="font-mono text-foreground font-semibold">{reportInfo.matricula}</div>
                    </div>

                    <div className="p-4 rounded-lg border border-orange-100 bg-orange-50/50">
                      <div className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-2">Tipo</div>
                      <Badge className="bg-orange-500 text-white">{getTipoRelatorioLabel(reportInfo.tipo_relatorio)}</Badge>
                    </div>

                    <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/50">
                      <div className="text-xs font-medium text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Período
                      </div>
                      <div className="text-sm text-foreground font-medium">
                        {formatDate(reportInfo.data_inicio)} até {formatDate(reportInfo.data_fim)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Gerado em</div>
                      <div className="text-sm text-foreground font-medium">{formatDateTime(reportInfo.gerado_em)}</div>
                    </div>

                    <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/50">
                      <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Valor total</div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-foreground">{reportInfo.valor_total_formatado}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-teal-100 bg-teal-50/50">
                      <div className="text-xs font-medium text-teal-600 uppercase tracking-wider mb-2">Visualizações</div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-teal-600" />
                        <span className="font-semibold text-foreground">{reportInfo.visualizacoes}</span>
                      </div>
                    </div>

                    {reportInfo.gerado_por && (
                      <div className="p-4 rounded-lg border border-pink-100 bg-pink-50/50 md:col-span-2">
                        <div className="text-xs font-medium text-pink-600 uppercase tracking-wider mb-2">Gerado por</div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-pink-100">
                            <User className="h-4 w-4 text-pink-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">
                              {reportInfo.gerado_por.nome} ({reportInfo.gerado_por.sigla})
                            </span>
                            <div className="mt-1">
                              <Badge variant="secondary" className="bg-pink-100 text-pink-700">{reportInfo.gerado_por.cargo}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={downloadPDF}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
                    </Button>
                  </div>
                </div>
              </>
            )}
      </CardContent>
    </Card>
  );
}
