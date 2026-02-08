import React, { useState, useEffect } from "react";
import { ChartBar, Download, FileText, Info, Search, X, Hash, Copy, Check, Shield, Eye, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useFeedback } from "@/contexts/FeedbackContext";
import { generatePDFFromHTML } from '@/utils/generatePDFFromHTML';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Beneficiary {
  matricula: number;
  nome: string;
  cpf: number;
  empresa: number;
}

interface Company {
  codigo: number;
  nome: string;
}

interface ReportFilters {
  nome: string;
  cpf: string;
  matricula: string;
  empresa: string;
}

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

export function ReportsPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'a_pagar' | 'pagos' | 'ir' | 'mensalidades'>('a_pagar');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [dateRange, setDateRange] = useState({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    nome: '',
    cpf: '',
    matricula: '',
    empresa: ''
  });
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [validateTokenModalOpen, setValidateTokenModalOpen] = useState(false);
  const [tokenToValidate, setTokenToValidate] = useState("");
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);
  const [reportHtmlContent, setReportHtmlContent] = useState("");
  const [reportFilename, setReportFilename] = useState("");
  const [loadingTokenReport, setLoadingTokenReport] = useState(false);
  const { mostrarToast, mostrarFeedback } = useFeedback();

  useEffect(() => {
    loadCompanies();
    searchBeneficiaries();
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('tabempresas')
        .select('codigo, nome')
        .order('nome');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao carregar lista de empresas');
    }
  };

  const searchBeneficiaries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cadben')
        .select('matricula, nome, cpf, empresa')
        .order('nome');

      if (filters.nome) {
        query = query.ilike('nome', `%${filters.nome}%`);
      }
      if (filters.cpf) {
        query = query.eq('cpf', parseInt(filters.cpf.replace(/\D/g, '')));
      }
      if (filters.matricula) {
        query = query.eq('matricula', parseInt(filters.matricula));
      }
      if (filters.empresa) {
        query = query.eq('empresa', parseInt(filters.empresa));
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (error) {
      console.error('Erro ao buscar beneficiários:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao buscar beneficiários');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      nome: '',
      cpf: '',
      matricula: '',
      empresa: ''
    });
    searchBeneficiaries();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBeneficiaries();
    }
  };

  const formatCPF = (cpf: number | string): string => {
    const cpfStr = cpf.toString().padStart(11, '0');
    return cpfStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateStr: string) => {
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

  const viewReportByToken = async () => {
    if (!tokenToValidate.trim()) {
      mostrarFeedback('aviso', 'Atenção', 'Por favor, digite um token válido');
      return;
    }

    setLoadingTokenReport(true);

    try {
      const supabaseUrl = 'https://akjwxhidgbrrtfzqucln.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrand4aGlkZ2JycnRmenF1Y2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODM0MTIsImV4cCI6MjA3Mjg1OTQxMn0.7bfCxFiWLaxGfe8A1ZSbHxV_hiSP8eYZCCX5GX7qxvw';
      
      const url = `${supabaseUrl}/functions/v1/view-report?token=${encodeURIComponent(tokenToValidate)}`;
      
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

      const data = await response.json();

      setReportHtmlContent(data.html);
      setReportFilename(data.filename);
      setReportInfo(data.info);

      mostrarToast('sucesso', 'Relatório carregado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao visualizar relatório:', error);
      mostrarFeedback('erro', 'Erro', error.message || 'Erro ao carregar relatório. Verifique o token e tente novamente.');
      setReportInfo(null);
      setReportHtmlContent("");
      setReportFilename("");
    } finally {
      setLoadingTokenReport(false);
    }
  };

  const downloadReportPDF = async () => {
    if (!reportHtmlContent) return;

    setLoadingTokenReport(true);

    try {
      await generatePDFFromHTML({ htmlContent: reportHtmlContent, filename: reportFilename });
      mostrarToast('sucesso', 'PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      mostrarFeedback('erro', 'Erro', 'Erro ao gerar PDF');
    } finally {
      setLoadingTokenReport(false);
    }
  };

  const getCompanyName = (codigo: number) => {
    const company = companies.find(c => c.codigo === codigo);
    return company?.nome || 'N/A';
  };

  const loadAvailableYears = async (matricula: number) => {
    try {
      const { data, error } = await supabase
        .from('relmensanual')
        .select('ano')
        .eq('matfuns', matricula)
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

  const openReportModal = async (beneficiary: Beneficiary, type: 'a_pagar' | 'pagos' | 'ir' | 'mensalidades') => {
    setSelectedBeneficiary(beneficiary);
    setReportType(type);

    if (type === 'mensalidades') {
      await loadAvailableYears(beneficiary.matricula);
    }

    if (type === 'ir' || type === 'mensalidades') {
      // Sincronizar dateRange com selectedYear quando abrir modal de IR ou Mensalidades
      setDateRange({
        dataInicio: `${selectedYear}-01-01`,
        dataFim: `${selectedYear}-12-31`
      });
    } else {
      // Resetar dateRange para o mês atual quando não for IR ou Mensalidades
      const now = new Date();
      setDateRange({
        dataInicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        dataFim: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      });
    }
    setReportModalOpen(true);
  };

  const generateReport = async () => {
    console.log('Função generateReport chamada');
    
    if (!selectedBeneficiary) {
      mostrarFeedback('erro', 'Erro', 'Nenhum beneficiário selecionado');
      return;
    }

    setGeneratingReport(true);

    // Referência ao iframe para garantir limpeza
    let iframeRef: HTMLIFrameElement | null = null;

    try {
      // Buscar token da sessão para autenticação segura
      const adminSessionStr = localStorage.getItem('admin_session');
      let sessionToken = null;

      if (adminSessionStr) {
        try {
          const sessionData = JSON.parse(adminSessionStr);
          sessionToken = sessionData.token;
        } catch (e) {
          console.error('Erro ao parsear sessão:', e);
          mostrarFeedback('erro', 'Erro', 'Sessão inválida');
          setLoading(false);
          return;
        }
      }

      if (!sessionToken) {
        mostrarFeedback('erro', 'Erro', 'Você precisa estar autenticado');
        setLoading(false);
        return;
      }

      console.log('Chamando função edge com dados:', {
        matricula: selectedBeneficiary.matricula,
        dataInicio: dateRange.dataInicio,
        dataFim: dateRange.dataFim,
        reportType: reportType
      });

      // Buscar sigla da sessão
      let geradoPorSigla = null;
      if (adminSessionStr) {
        try {
          const sessionData = JSON.parse(adminSessionStr);
          geradoPorSigla = sessionData.sigla;
        } catch (e) {
          console.error('Erro ao parsear sessão:', e);
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          matricula: selectedBeneficiary.matricula,
          dataInicio: dateRange.dataInicio,
          dataFim: dateRange.dataFim,
          reportType: reportType,
          geradoPorSigla: geradoPorSigla, // Enviando sigla para validação
        }
      });

      if (error) {
        console.error('Erro ao chamar função de relatório:', error);
        throw error;
      }

      console.log('Resposta da função edge:', data);

      const { html, filename, token } = data;
      
      // Salvar o token gerado
      if (token) {
        setGeneratedToken(token);
      }

      console.log('HTML recebido (primeiros 200 chars):', html.substring(0, 200));

      // Criar iframe isolado para não afetar estilos da página principal
      const iframe = document.createElement('iframe');
      iframeRef = iframe;
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '750px';
      iframe.style.height = '3000px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      // Aguardar iframe carregar
      await new Promise(resolve => setTimeout(resolve, 100));

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Não foi possível acessar o documento do iframe');
      }

      // Escrever o HTML completo no iframe (já vem com estilos da edge function)
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Aguardar renderização completa dos elementos
      await new Promise(resolve => setTimeout(resolve, 800));

      const tempDiv = iframeDoc.body as HTMLElement;
      if (!tempDiv) {
        throw new Error('Body do iframe não encontrado');
      }
      
      // Forçar reflow para garantir que offsetHeight funcione
      void tempDiv.offsetHeight;

      console.log('Iniciando paginação inteligente...');

      // Configuração de página A4 para o PDF
      const pageWidth = 210; // mm
      const marginLeft = 12;
      const marginTop = 8;
      const marginRight = 12;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Altura máxima por página em pixels
      const maxHeightPx = 1040; // +1 procedimento
      console.log('Configuração de página - maxHeightPx:', maxHeightPx);

      // Obter elementos principais
      const header = tempDiv.querySelector('.header') as HTMLElement;
      const infoBox = tempDiv.querySelector('.info-box') as HTMLElement;
      const footer = tempDiv.querySelector('.footer') as HTMLElement;

      // Token é o último div que contém "Token de Validação"
      const allDivs = Array.from(tempDiv.querySelectorAll('div'));
      const tokenDiv = allDivs.find(div => div.textContent?.includes('Token de Validação')) as HTMLElement;

      // Incluir .highlight (observações) mas NÃO incluir .total-geral (é TR dentro de table)
      // Incluir .declaracao-text para garantir que o texto "DECLARAMOS..." apareça
      const sections = Array.from(tempDiv.querySelectorAll('.declaracao-text, .section-title, table, .no-data, .highlight')) as HTMLElement[];

      console.log('Elementos encontrados - Header:', !!header, 'InfoBox:', !!infoBox, 'Footer:', !!footer, 'Token:', !!tokenDiv, 'Sections:', sections.length);
      
      // Debug: mostrar alturas brutas dos elementos principais
      if (header) console.log('Header rect:', header.getBoundingClientRect(), 'offsetHeight:', header.offsetHeight);
      if (infoBox) console.log('InfoBox rect:', infoBox.getBoundingClientRect(), 'offsetHeight:', infoBox.offsetHeight);
      sections.forEach((s, idx) => {
        console.log(`Section[${idx}] ${s.tagName}.${s.className}:`, s.getBoundingClientRect().height, 'offset:', s.offsetHeight);
      });

      // Função para agrupar elementos em páginas
      const paginas: HTMLElement[][] = [];
      let paginaAtual: HTMLElement[] = [];
      let alturaAcumulada = 0;

      // Fator de correção: html2canvas renderiza maior que as medições do DOM
      const FATOR_CORRECAO = 1.10; // Otimizado para mais conteúdo por página
      
      // Função auxiliar para obter altura real do elemento
      const getElementHeight = (el: HTMLElement): number => {
        // Tentar getBoundingClientRect primeiro
        const rect = el.getBoundingClientRect();
        let height = rect.height;
        
        // Se retornar 0, tentar offsetHeight
        if (!height || height === 0) {
          height = el.offsetHeight;
        }
        
        // Aplicar fator de correção
        height = height * FATOR_CORRECAO;
        
        // Se ainda for 0, estimar baseado no conteúdo
        if (!height || height === 0) {
          const textContent = el.textContent || '';
          
          if (el.tagName === 'TR') {
            // Estimar altura baseado no conteúdo do texto
            const textLength = textContent.length;
            
            // Se o texto for longo, provavelmente quebra em múltiplas linhas
            // Cada linha tem ~50-60 caracteres, altura de ~22px por linha
            const estimatedLines = Math.max(1, Math.ceil(textLength / 80));
            height = Math.max(32, estimatedLines * 22 + 10); // mínimo 32px, +10px de padding
            
          } else if (el.tagName === 'TABLE') {
            const rows = el.querySelectorAll('tr').length;
            height = rows * 40 + 50; // 40px por linha (considerando quebras), 50px para header
          } else if (el.classList.contains('section-title')) {
            height = 35;
          } else if (el.classList.contains('info-box')) {
            height = 100;
          } else if (el.classList.contains('header')) {
            height = 120;
          } else if (el.classList.contains('footer')) {
            height = 80;
          } else {
            height = 40; // fallback genérico maior
          }
          console.log('AVISO: Altura estimada para', el.tagName, el.className, '=', height, 'px (texto:', textContent.substring(0, 30), '...)');
        }
        
        return height;
      };

      // IMPORTANTE: Header e InfoBox ocupam espaço na primeira página
      // Calcular altura inicial considerando eles
      let headerInfoHeight = 0;
      if (header) {
        const h = getElementHeight(header);
        headerInfoHeight += h;
        console.log('Header altura:', h, 'px');
      }
      if (infoBox) {
        const h = getElementHeight(infoBox);
        headerInfoHeight += h;
        console.log('InfoBox altura:', h, 'px');
      }

      // Já começar contando header + infoBox
      alturaAcumulada = headerInfoHeight;
      console.log('Altura inicial da página 1 (header + infoBox):', alturaAcumulada, 'px');
      console.log('Altura máxima por página:', maxHeightPx, 'px');

      // Processar cada seção
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionHeight = getElementHeight(section);

        // Se é um título de seção
        if (section.classList.contains('section-title')) {
          // Verificar se o próximo elemento é uma tabela de resumo
          const proximaSection = i + 1 < sections.length ? sections[i + 1] : null;
          const isTituloResumo = section.textContent?.includes('Resumo') && 
                                 proximaSection?.tagName === 'TABLE' && 
                                 proximaSection?.classList.contains('resumo-compacto');
          
          if (isTituloResumo) {
            // Calcular altura total: título + resumo + elementos que vêm depois
            let alturaFutura = sectionHeight + getElementHeight(proximaSection);
            
            // Verificar elementos que vêm depois do resumo (highlight, footer, token)
            for (let j = i + 2; j < sections.length; j++) {
              alturaFutura += getElementHeight(sections[j]);
            }
            if (footer) alturaFutura += getElementHeight(footer);
            if (tokenDiv) alturaFutura += getElementHeight(tokenDiv);
            
            // Se não cabe tudo junto, quebrar página antes do título
            if (alturaAcumulada + alturaFutura > maxHeightPx && paginaAtual.length > 0) {
              console.log('Quebra de página - Título Resumo + conteúdo não cabe inteiro. Altura:', alturaAcumulada, '+', alturaFutura, '>', maxHeightPx);
              paginas.push([...paginaAtual]);
              paginaAtual = [];
              alturaAcumulada = 0;
            }
          } else {
            // Para outros títulos, comportamento normal
          if (alturaAcumulada + sectionHeight > maxHeightPx) {
            if (paginaAtual.length > 0) {
              console.log('Quebra de página - Título não cabe. Altura:', alturaAcumulada, '+', sectionHeight, '>', maxHeightPx);
              paginas.push([...paginaAtual]);
              paginaAtual = [];
              alturaAcumulada = 0;
            } else {
              console.log('AVISO: Primeira seção não cabe mas será adicionada para evitar página vazia');
              }
            }
          }

          paginaAtual.push(section);
          alturaAcumulada += sectionHeight;
          console.log('Adicionado título:', section.textContent?.substring(0, 30), 'Altura:', sectionHeight, 'Total acumulado:', alturaAcumulada);
        }
        // Se é uma tabela ou total geral
        else {
          // Para tabelas, verificar linha por linha
          if (section.tagName === 'TABLE') {
            // ADICIONAR ESPAÇO ANTES DE TABELAS DE DEPENDENTES
            const isTabelaDependente = section.classList.contains('tabela-dependente');
            if (isTabelaDependente) {
              console.log('✅ Tabela dependente detectada - Adicionando 40px de espaço');
              alturaAcumulada += 40; // Adicionar 40px de espaço virtual
            }

            const tbody = section.querySelector('tbody');
            const allRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

            // Separar linhas normais de linhas de total
            const normalRows: HTMLElement[] = [];
            const totalRows: HTMLElement[] = [];

            for (const row of allRows) {
              if (row.classList.contains('total-row') || row.classList.contains('total-geral')) {
                totalRows.push(row as HTMLElement);
              } else {
                normalRows.push(row as HTMLElement);
              }
            }

            console.log('Tabela - Linhas normais:', normalRows.length, 'Linhas de total:', totalRows.length);

            // Calcular altura total das linhas de total ANTES para reservar espaço
            const totalRowsHeight = totalRows.reduce((acc, row) => acc + getElementHeight(row), 0);
            console.log('Altura reservada para totais:', totalRowsHeight);

            // Criar uma tabela temporária para cada grupo de linhas (no iframe!)
            const theadClone = section.querySelector('thead')?.cloneNode(true);
            const tbodyClone = iframeDoc.createElement('tbody');

            let tempTable = iframeDoc.createElement('table');
            tempTable.className = section.className;
            if (theadClone) tempTable.appendChild(theadClone.cloneNode(true));
            tempTable.appendChild(tbodyClone);

            // Processar apenas linhas normais
            for (let rowIndex = 0; rowIndex < normalRows.length; rowIndex++) {
              const row = normalRows[rowIndex];
              const rowHeight = getElementHeight(row);
              const isLastRow = rowIndex === normalRows.length - 1;
              
              // Se é a última linha, precisamos reservar espaço para os totais também
              const espacoNecessario = isLastRow ? rowHeight + totalRowsHeight : rowHeight;

              // Se adicionar esta linha (+ totais se for última) ultrapassa o limite
              if (alturaAcumulada + espacoNecessario > maxHeightPx) {
                // Verificar se tem conteúdo na página atual ou na tabela atual
                const temConteudo = paginaAtual.length > 0 || tbodyClone.children.length > 0;

                if (temConteudo) {
                  // Finalizar tabela atual e começar nova página
                  paginaAtual.push(tempTable);
                  paginas.push([...paginaAtual]);
                  console.log('Quebra de página - Linha não cabe. Altura:', alturaAcumulada, '+', rowHeight, '>', maxHeightPx);

                  // Nova página com nova tabela
                  paginaAtual = [];
                  alturaAcumulada = 0;
                  tempTable = iframeDoc.createElement('table');
                  tempTable.className = section.className;
                  if (theadClone) tempTable.appendChild(theadClone.cloneNode(true));
                  // CRIAR NOVO TBODY E ATUALIZAR A REFERÊNCIA
                  const newTbody = iframeDoc.createElement('tbody');
                  tempTable.appendChild(newTbody);
                  newTbody.appendChild(row.cloneNode(true));
                  alturaAcumulada += rowHeight;
                  // ATUALIZAR tbodyClone para o novo tbody!
                  Object.assign(tbodyClone, { replaceWith: newTbody });
                  // Na verdade, vamos usar o tbody da tempTable diretamente
                } else {
                  // Primeira linha, adicionar mesmo que não caiba (para evitar loop infinito)
                  console.log('AVISO: Primeira linha não cabe mas será adicionada. Altura:', alturaAcumulada, '+', rowHeight, '>', maxHeightPx);
                  const currentBody = tempTable.querySelector('tbody') || tbodyClone;
                  currentBody.appendChild(row.cloneNode(true));
                  alturaAcumulada += rowHeight;
                }
              } else {
                // Adicionar linha à tabela atual - usar tbody da tabela atual
                const currentBody = tempTable.querySelector('tbody') || tbodyClone;
                currentBody.appendChild(row.cloneNode(true));
                alturaAcumulada += rowHeight;
              }
            }

            // Adicionar linhas de total ao final da última tabela
            const currentTbody = tempTable.querySelector('tbody');
            if (currentTbody) {
              for (const totalRow of totalRows) {
                const totalHeight = getElementHeight(totalRow);

                // Se total não cabe, criar nova página
                if (alturaAcumulada + totalHeight > maxHeightPx) {
                  const temConteudo = paginaAtual.length > 0 || currentTbody.children.length > 0;

                  if (temConteudo) {
                    paginaAtual.push(tempTable);
                    paginas.push([...paginaAtual]);
                    console.log('Quebra de página - Total não cabe. Altura:', alturaAcumulada, '+', totalHeight, '>', maxHeightPx);

                    paginaAtual = [];
                    alturaAcumulada = 0;
                    tempTable = iframeDoc.createElement('table');
                    tempTable.className = section.className;
                    const emptyTbody = iframeDoc.createElement('tbody');
                    tempTable.appendChild(emptyTbody);
                  } else {
                    console.log('AVISO: Total não cabe mas será adicionado');
                  }
                }

                const tbody = tempTable.querySelector('tbody');
                if (tbody) {
                  tbody.appendChild(totalRow.cloneNode(true));
                  alturaAcumulada += totalHeight;
                }
              }
            }

            // Adicionar última tabela
            if (tempTable.querySelector('tbody')?.children.length) {
              paginaAtual.push(tempTable);
            }
          } else {
            // Para outros elementos (no-data, highlight/observações)
            if (alturaAcumulada + sectionHeight > maxHeightPx) {
              if (paginaAtual.length > 0) {
                paginas.push([...paginaAtual]);
                paginaAtual = [];
                alturaAcumulada = 0;
                console.log('Quebra de página - Elemento não cabe. Altura:', alturaAcumulada, '+', sectionHeight, '>', maxHeightPx);
              } else {
                console.log('AVISO: Primeiro elemento não cabe mas será adicionado');
              }
            }
            paginaAtual.push(section);
            alturaAcumulada += sectionHeight;
            console.log('Adicionado elemento:', section.className, 'Altura:', sectionHeight, 'Total acumulado:', alturaAcumulada);
          }
        }
      }

      // Adicionar footer e token à última página
      if (footer) {
        const footerHeight = getElementHeight(footer);
        if (alturaAcumulada + footerHeight > maxHeightPx && paginaAtual.length > 0) {
          // Footer não cabe, criar nova página
          paginas.push([...paginaAtual]);
          paginaAtual = [];
          alturaAcumulada = 0;
        }
        paginaAtual.push(footer);
        alturaAcumulada += footerHeight;
        console.log('Footer adicionado, altura:', footerHeight, 'px');
      }

      if (tokenDiv && tokenDiv.textContent?.includes('Token')) {
        const tokenHeight = getElementHeight(tokenDiv);
        if (alturaAcumulada + tokenHeight > maxHeightPx && paginaAtual.length > 0) {
          // Token não cabe, criar nova página
          paginas.push([...paginaAtual]);
          paginaAtual = [];
          alturaAcumulada = 0;
        }
        paginaAtual.push(tokenDiv);
        console.log('Token adicionado, altura:', tokenHeight, 'px');
      }

      // Adicionar última página
      if (paginaAtual.length > 0) {
        paginas.push(paginaAtual);
      }

      console.log('Total de páginas criadas:', paginas.length);

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Gerar cada página
      for (let i = 0; i < paginas.length; i++) {
        console.log(`Gerando página ${i + 1}/${paginas.length}...`);

        // Limpar o body do iframe e recriar conteúdo para esta página
        // Preservar os estilos que estão no <head>
        while (iframeDoc.body.firstChild) {
          iframeDoc.body.removeChild(iframeDoc.body.firstChild);
        }

        // Criar div para esta página dentro do iframe
        const pageDiv = iframeDoc.createElement('div');
        pageDiv.style.width = '702px';
        pageDiv.style.backgroundColor = '#ffffff';
        pageDiv.style.boxSizing = 'border-box';
        // Padding mínimo no topo
        pageDiv.style.padding = i === 0 ? '2px 8px 20px 8px' : '0px 8px 20px 8px';
        pageDiv.style.fontFamily = 'Arial, sans-serif';
        pageDiv.style.fontSize = '10px';
        pageDiv.style.lineHeight = '1.4';
        pageDiv.style.color = '#333';
        pageDiv.style.margin = '0';

        // Adicionar header e infoBox apenas na primeira página
        if (i === 0) {
          if (header) {
            const headerClone = header.cloneNode(true) as HTMLElement;
            pageDiv.appendChild(headerClone);
          }
          if (infoBox) {
            const infoBoxClone = infoBox.cloneNode(true) as HTMLElement;
            pageDiv.appendChild(infoBoxClone);
          }
        }

        // Adicionar elementos desta página
        paginas[i].forEach((el, idx) => {
          const clone = el.cloneNode(true) as HTMLElement;

          // ADICIONAR SPACER VISUAL ANTES DE TABELAS DE DEPENDENTES
          const isTabelaDependente = clone.classList && clone.classList.contains('tabela-dependente');
          if (isTabelaDependente) {
            const spacer = iframeDoc.createElement('div');
            spacer.style.cssText = 'height: 45px; margin: 0; padding: 0; display: block; clear: both; background: transparent;';
            pageDiv.appendChild(spacer);
            console.log('✅ Spacer de 45px adicionado antes da tabela dependente');
          }

          // REMOVER margin-top do primeiro elemento (exceto na página 1 que tem header)
          // MAS NÃO remover de tabelas dependentes (precisam do espaço)
          if (idx === 0 && i > 0 && !isTabelaDependente) {
            clone.style.marginTop = '0';
          }
          pageDiv.appendChild(clone);
        });

        iframeDoc.body.appendChild(pageDiv);

        await new Promise(resolve => setTimeout(resolve, 150));

        // Capturar como imagem usando html2canvas COM O CONTEXTO DO IFRAME
        const iframeWindow = iframe.contentWindow;
        const canvas = await html2canvas(pageDiv, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 702,
          windowWidth: 750,
          // USAR O WINDOW DO IFRAME para evitar estilos do React/Tailwind
          ...(iframeWindow ? { windowWidth: 750 } : {}),
          onclone: (clonedDoc) => {
            // REMOVER todos os estilos existentes (Tailwind, etc)
            const existingStyles = clonedDoc.head.querySelectorAll('style, link[rel="stylesheet"]');
            existingStyles.forEach(el => el.remove());
            
            // Adicionar APENAS os estilos do iframe
            const styles = iframeDoc.head.querySelectorAll('style');
            styles.forEach(style => {
              clonedDoc.head.appendChild(style.cloneNode(true));
            });
            
            // Forçar estilos no body
            clonedDoc.body.style.cssText = 'margin:0!important;padding:0!important;font-size:10px!important;line-height:1.4!important;font-family:Arial,sans-serif!important;color:#333!important;background:#fff!important;';
            
            // Reset agressivo em TODAS as tabelas e células
            const allTables = clonedDoc.body.querySelectorAll('table');
            allTables.forEach(table => {
              const htmlTable = table as HTMLElement;
              // NÃO forçar margin:0 em tabelas dependentes!
              const isTabelaDependente = htmlTable.classList.contains('tabela-dependente');
              if (isTabelaDependente) {
                htmlTable.style.cssText = 'padding:0!important;border-collapse:collapse!important;width:100%!important;margin-top:0!important;';
              } else {
                htmlTable.style.cssText = 'margin:0!important;padding:0!important;border-collapse:collapse!important;width:100%!important;';
              }
              
              const allCells = table.querySelectorAll('th, td');
              allCells.forEach(cell => {
                const htmlCell = cell as HTMLElement;
                // Preservar padding inline mas garantir que não tem margin
                htmlCell.style.margin = '0!important';
                htmlCell.style.verticalAlign = 'middle!important';
                htmlCell.style.borderCollapse = 'collapse!important';
              });
            });
            
            // Resetar outros elementos para evitar conflitos
            const allElements = clonedDoc.body.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.tagName !== 'TABLE' && htmlEl.tagName !== 'TH' && htmlEl.tagName !== 'TD') {
                if (htmlEl.style) {
                  // Garantir que não herda estilos problemáticos
                  if (!htmlEl.style.fontFamily) htmlEl.style.fontFamily = 'inherit';
                  if (!htmlEl.style.fontSize) htmlEl.style.fontSize = 'inherit';
                  if (!htmlEl.style.lineHeight) htmlEl.style.lineHeight = 'inherit';
                }
              }
            });
          }
        });

        // Adicionar ao PDF
        if (i > 0) pdf.addPage();

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight, undefined, 'FAST');
        
        // Adicionar numeração da página no canto inferior direito
        const pageNum = i + 1;
        const totalPages = paginas.length;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const pageText = `${pageNum}/${totalPages}`;
        // Posição: canto inferior direito (210mm - margem, 297mm - margem)
        pdf.text(pageText, 210 - marginLeft, 297 - marginLeft, { align: 'right' });
      }

      pdf.save(filename);

      mostrarToast('sucesso', 'Relatório gerado com sucesso!');

      setReportModalOpen(false);
      
      if (token) {
        setTokenModalOpen(true);
      }
    } catch (error: unknown) {
      console.error('Erro completo ao gerar relatório:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Verificar se é um erro de dados não encontrados
      if (errorMessage.includes('não encontrado') ||
          errorMessage.includes('Nenhum procedimento') ||
          errorMessage.includes('404')) {
        mostrarFeedback('aviso', 'Sem dados', 'Nenhum procedimento encontrado para o período selecionado. Tente outro período com dados cadastrados.');
      } else {
        mostrarFeedback('erro', 'Erro', `Erro ao gerar relatório: ${errorMessage || 'Erro desconhecido'}`);
      }
    } finally {
      // Garantir que o iframe seja removido
      if (iframeRef && iframeRef.parentNode) {
        iframeRef.parentNode.removeChild(iframeRef);
      }
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ChartBar className="h-6 w-6 sm:h-8 sm:w-8" />
            Relatórios por Associado
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Busque associados e gere relatórios individuais de procedimentos.
          </p>
        </div>
        <Button 
          onClick={() => setValidateTokenModalOpen(true)}
          variant="outline"
          className="gap-2 w-full sm:w-auto"
        >
          <Shield className="h-4 w-4" />
          <span className="sm:inline">Validar Tokens</span>
        </Button>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Relatórios Administrativos</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gere relatórios detalhados por associado, incluindo procedimentos a pagar, pagos e IR.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Busca de Associados */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Buscar Associados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Digite o nome..."
                value={filters.nome}
                onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={filters.cpf}
                onChange={(e) => setFilters({ ...filters, cpf: e.target.value })}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                placeholder="Ex: 12345"
                value={filters.matricula}
                onChange={(e) => setFilters({ ...filters, matricula: e.target.value })}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <select
                id="empresa"
                value={filters.empresa}
                onChange={(e) => setFilters({ ...filters, empresa: e.target.value })}
                onKeyDown={handleKeyPress}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todas as empresas</option>
                {companies.map((company) => (
                  <option key={company.codigo} value={company.codigo}>
                    {company.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={searchBeneficiaries} disabled={loading} className="gap-2 w-full sm:w-auto">
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
            <Button variant="outline" onClick={clearFilters} className="gap-2 w-full sm:w-auto">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Associados Encontrados ({beneficiaries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loading ? (
            <>
              {/* Desktop Table Skeleton */}
              <div className="hidden xl:block p-4 sm:p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Procedimentos a Pagar</TableHead>
                      <TableHead>Procedimentos Pagos</TableHead>
                      <TableHead>Auxílio</TableHead>
                      <TableHead>IR</TableHead>
                      <TableHead>Mensalidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-32 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-6 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-24 rounded"></div></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-32 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-6 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-24 rounded"></div></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-32 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-6 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-24 rounded"></div></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-32 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-6 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-24 rounded"></div></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><div className="skeleton-shimmer h-4 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-48 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-24 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-4 w-32 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-20 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-6 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-16 rounded"></div></TableCell>
                      <TableCell><div className="skeleton-shimmer h-8 w-24 rounded"></div></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards Skeleton */}
              <div className="xl:hidden space-y-3 p-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-32 rounded"></div>
            </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-6 w-full rounded"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-6 w-full rounded"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-6 w-full rounded"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-6 w-full rounded"></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="skeleton-shimmer h-5 w-48 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                      <div className="skeleton-shimmer h-4 w-32 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-8 w-full rounded"></div>
                      <div className="skeleton-shimmer h-6 w-full rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Table - apenas em telas muito grandes */}
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Procedimentos a Pagar</TableHead>
                      <TableHead>Procedimentos Pagos</TableHead>
                      <TableHead>Auxílio</TableHead>
                      <TableHead>IR</TableHead>
                      <TableHead>Mensalidades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaries.length > 0 ? (
                      beneficiaries.map((beneficiary) => (
                        <TableRow key={beneficiary.matricula}>
                          <TableCell className="font-medium">{beneficiary.matricula}</TableCell>
                          <TableCell className="font-medium">{beneficiary.nome}</TableCell>
                          <TableCell className="font-mono text-xs">{formatCPF(beneficiary.cpf)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground truncate block max-w-[120px]" title={getCompanyName(beneficiary.empresa)}>
                              {getCompanyName(beneficiary.empresa)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openReportModal(beneficiary, 'a_pagar')}
                              className="bg-orange-600 hover:bg-orange-700 gap-1 text-xs px-2"
                            >
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden xl:inline">Proc. a Pagar</span>
                              <span className="xl:hidden">A Pg</span>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openReportModal(beneficiary, 'pagos')}
                              className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs px-2"
                            >
                              <Download className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden xl:inline">Proc. Pagos</span>
                              <span className="xl:hidden">Pg</span>
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">Breve</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openReportModal(beneficiary, 'ir')}
                              className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 gap-1 text-xs px-2"
                            >
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              IR
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openReportModal(beneficiary, 'mensalidades')}
                              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 gap-1 text-xs px-2"
                            >
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="hidden 2xl:inline">Mensalidades</span>
                              <span className="2xl:hidden xl:inline">Mens.</span>
                              <span className="xl:hidden">M.</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          <ChartBar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          Nenhum associado encontrado.
                          <br />
                          <small>Verifique os filtros de pesquisa ou tente novamente.</small>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Cards para Mobile e Tablet */}
              <div className="xl:hidden space-y-3 p-4">
                {beneficiaries.length > 0 ? (
                  beneficiaries.map((beneficiary) => (
                    <Card key={beneficiary.matricula} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{beneficiary.nome}</p>
                              <p className="text-xs text-muted-foreground">Mat: {beneficiary.matricula}</p>
                            </div>
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">{formatCPF(beneficiary.cpf)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getCompanyName(beneficiary.empresa)}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            onClick={() => openReportModal(beneficiary, 'a_pagar')}
                            className="bg-orange-600 hover:bg-orange-700 text-white w-full gap-1 text-xs h-8"
                          >
                            <FileText className="h-3 w-3" />
                            Proc. a Pagar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openReportModal(beneficiary, 'pagos')}
                            className="bg-green-600 hover:bg-green-700 text-white w-full gap-1 text-xs h-8"
                          >
                            <Download className="h-3 w-3" />
                            Proc. Pagos
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openReportModal(beneficiary, 'ir')}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-1 text-xs h-8"
                          >
                            <FileText className="h-3 w-3" />
                            IR
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openReportModal(beneficiary, 'mensalidades')}
                            className="bg-purple-600 hover:bg-purple-700 text-white w-full gap-1 text-xs h-8"
                          >
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Mensalidades</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChartBar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Nenhum associado encontrado.</p>
                    <p className="text-xs mt-1">Verifique os filtros de pesquisa ou tente novamente.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Período para Relatórios */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Selecionar Período</DialogTitle>
            <DialogDescription className="text-sm">
              {reportType === 'ir' 
                ? 'Selecione o ano para gerar o relatório de Imposto de Renda.'
                : reportType === 'mensalidades'
                ? 'Selecione o ano para gerar o relatório de Relação de Mensalidades.'
                : `Selecione o período para gerar o relatório de ${reportType === 'a_pagar' ? 'procedimentos a pagar' : 'procedimentos pagos'}.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reportType === 'ir' || reportType === 'mensalidades' ? (
              <div className="space-y-2">
                <Label htmlFor="ano">Ano:</Label>
                {reportType === 'mensalidades' && availableYears.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    Nenhum ano com mensalidades disponível para este associado.
                  </div>
                ) : (
                  <select
                    id="ano"
                    value={selectedYear}
                    onChange={(e) => {
                      const ano = parseInt(e.target.value);
                      setSelectedYear(ano);
                      setDateRange({
                        dataInicio: `${ano}-01-01`,
                        dataFim: `${ano}-12-31`
                      });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reportType === 'mensalidades'
                      ? availableYears.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))
                      : Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 1 - i).map(year => (
                          <option key={year} value={year}>
                            {`${year + 1} (ano calendário ${year})`}
                          </option>
                        ))
                    }
                  </select>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início:</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dateRange.dataInicio}
                    onChange={(e) => setDateRange(prev => ({ ...prev, dataInicio: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim:</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dateRange.dataFim}
                    onChange={(e) => setDateRange(prev => ({ ...prev, dataFim: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            {reportType !== 'ir' && reportType !== 'mensalidades' && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Informação:</p>
                      <ul className="text-blue-700 mt-1 space-y-1">
                        <li>• O relatório incluirá todos os procedimentos do período selecionado</li>
                        <li>• Máximo de 1 ano de diferença entre as datas</li>
                        <li>• O arquivo PDF será gerado automaticamente</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={generateReport}
              className="w-full gap-2"
              disabled={generatingReport || (reportType === 'mensalidades' && availableYears.length === 0)}
            >
              {generatingReport ? "Gerando..." : <><Download className="h-4 w-4" /> Gerar Relatório</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Token Gerado */}
      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5" />
              Token do Relatório Gerado
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Use este token para visualizar o relatório posteriormente ou compartilhar com o beneficiário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Token:</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedToken || ''}
                  readOnly
                  className="font-mono text-xs sm:text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => {
                    if (generatedToken) {
                      navigator.clipboard.writeText(generatedToken);
                      mostrarToast('sucesso', 'Token copiado para a área de transferência!');
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium">Como usar o token:</p>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• Acesse a página de relatórios</li>
                      <li>• Digite o token para visualizar o relatório novamente</li>
                      <li>• O sistema registra cada visualização</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => setTokenModalOpen(false)} className="w-full">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Validar Token */}
      <Dialog open={validateTokenModalOpen} onOpenChange={(open) => {
        setValidateTokenModalOpen(open);
        if (!open) {
          setReportInfo(null);
          setReportHtmlContent("");
          setReportFilename("");
          setTokenToValidate("");
        }
      }}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Validar Token de Relatório
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Digite o token para visualizar e validar um relatório gerado anteriormente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validateToken" className="text-sm">Token:</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="validateToken"
                  value={tokenToValidate}
                  onChange={(e) => setTokenToValidate(e.target.value)}
                  placeholder="Digite o token do relatório"
                  className="font-mono text-xs sm:text-sm flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && viewReportByToken()}
                />
                <Button
                  onClick={viewReportByToken}
                  disabled={loadingTokenReport}
                  className="w-full sm:w-auto gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {loadingTokenReport ? 'Buscando...' : 'Visualizar'}
                </Button>
              </div>
            </div>
            
            {reportInfo ? (
              <>
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Informações do Relatório</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onClick={downloadReportPDF}
                      disabled={loadingTokenReport}
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loadingTokenReport ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium">Informações sobre tokens:</p>
                    <ul className="text-muted-foreground mt-1 space-y-1">
                      <li>• Cada relatório gerado possui um token único</li>
                      <li>• O token permite visualizar o relatório sem precisar gerá-lo novamente</li>
                      <li>• Todas as visualizações são registradas no sistema</li>
                      <li>• O token pode ser compartilhado com o beneficiário</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}