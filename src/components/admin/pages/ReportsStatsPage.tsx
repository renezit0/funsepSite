import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartBar, TrendingUp, Users, Calendar, Info, FileText, Eye, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ReportStats {
  total: number;
  a_pagar: number;
  pagos: number;
  ir: number;
  por_usuario: Array<{
    gerado_por_sigla: string;
    count: number;
  }>;
  por_data: Array<{
    data: string;
    count: number;
  }>;
  relatorios: Array<{
    id: string;
    token: string;
    matricula: number;
    tipo_relatorio: string;
    gerado_por_sigla: string | null;
    gerado_em: string;
    visualizacoes: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ReportsStatsPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    a_pagar: 0,
    pagos: 0,
    ir: 0,
    por_usuario: [],
    por_data: [],
    relatorios: []
  });
  const [dateFilter, setDateFilter] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Verificar permissões
    const adminRoles = ['GERENTE', 'DESENVOLVEDOR', 'ANALISTA DE SISTEMAS'];
    if (!session?.user?.cargo || !adminRoles.includes(session.user.cargo)) {
      console.error('Usuário sem permissão para acessar estatísticas');
      return;
    }
    loadStats();
  }, [dateFilter, session]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Buscar todos os relatórios no período
      const { data: relatorios, error } = await supabase
        .from('relatorio_tokens')
        .select('*')
        .gte('gerado_em', dateFilter.inicio)
        .lte('gerado_em', dateFilter.fim + 'T23:59:59')
        .order('gerado_em', { ascending: false });

      if (error) throw error;

      // Processar estatísticas
      const total = relatorios?.length || 0;
      const a_pagar = relatorios?.filter(r => r.tipo_relatorio === 'a_pagar').length || 0;
      const pagos = relatorios?.filter(r => r.tipo_relatorio === 'pagos').length || 0;
      const ir = relatorios?.filter(r => r.tipo_relatorio === 'ir').length || 0;

      // Agrupar por usuário
      const usuarioMap = new Map<string, number>();
      relatorios?.forEach(rel => {
        const sigla = rel.gerado_por_sigla || 'N/A';
        usuarioMap.set(sigla, (usuarioMap.get(sigla) || 0) + 1);
      });
      const por_usuario = Array.from(usuarioMap.entries())
        .map(([gerado_por_sigla, count]) => ({ gerado_por_sigla, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Agrupar por data (dia)
      const dataMap = new Map<string, number>();
      relatorios?.forEach(rel => {
        const data = rel.gerado_em.split('T')[0];
        dataMap.set(data, (dataMap.get(data) || 0) + 1);
      });
      const por_data = Array.from(dataMap.entries())
        .map(([data, count]) => ({ data, count }))
        .sort((a, b) => a.data.localeCompare(b.data));

      setStats({
        total,
        a_pagar,
        pagos,
        ir,
        por_usuario,
        por_data,
        relatorios: relatorios?.slice(0, 50) || []
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'a_pagar': 'A Pagar',
      'pagos': 'Pagos',
      'ir': 'IR'
    };
    return labels[tipo] || tipo;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Aqui você pode adicionar um toast se necessário
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const tipoData = [
    { name: 'A Pagar', value: stats.a_pagar },
    { name: 'Pagos', value: stats.pagos },
    { name: 'IR', value: stats.ir }
  ].filter(item => item.value > 0);

  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="skeleton-shimmer h-4 w-32 rounded"></div>
        <div className="skeleton-shimmer h-4 w-4 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="skeleton-shimmer h-8 w-20 rounded mb-2"></div>
        <div className="skeleton-shimmer h-3 w-full rounded"></div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
              Estatísticas de Relatórios
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Análise detalhada dos relatórios gerados no sistema
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
            Estatísticas de Relatórios
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Análise detalhada dos relatórios gerados no sistema
          </p>
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Estatísticas de Relatórios</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visualize análises completas sobre a geração de relatórios, incluindo tipos, geradores e tendências temporais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dateFilter.inicio}
                onChange={(e) => setDateFilter({ ...dateFilter, inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dateFilter.fim}
                onChange={(e) => setDateFilter({ ...dateFilter, fim: e.target.value })}
              />
            </div>
            <Button onClick={loadStats} className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Aplicar Filtro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <ChartBar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.a_pagar.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.a_pagar / stats.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <ChartBar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.pagos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.pagos / stats.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IR</CardTitle>
            <ChartBar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.ir.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? `${((stats.ir / stats.total) * 100).toFixed(1)}% do total` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Gráfico de Pizza - Por Tipo */}
        {tipoData.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tipoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tipoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Barras - Por Data */}
        {stats.por_data.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Relatórios por Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.por_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="data" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico de Barras - Por Usuário */}
      {stats.por_usuario.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Top 10 - Relatórios por Usuário</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.por_usuario} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="gerado_por_sigla" type="category" width={80} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de Relatórios Recentes */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Relatórios Recentes (últimos 50)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {stats.relatorios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum relatório encontrado no período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="hidden sm:table-cell">Matrícula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Gerado por</TableHead>
                    <TableHead className="hidden md:table-cell">Visualizações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.relatorios.map((rel) => (
                    <TableRow key={rel.id}>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(rel.gerado_em), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          <span className="text-muted-foreground sm:hidden">{rel.matricula}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{rel.matricula}</TableCell>
                      <TableCell>
                        <Badge variant={rel.tipo_relatorio === 'ir' ? 'default' : 'secondary'} className="text-xs">
                          {getTipoLabel(rel.tipo_relatorio)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm">{rel.gerado_por_sigla || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm">{rel.visualizacoes}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent className="hidden sm:block">
                              <p>Ver Token</p>
                            </TooltipContent>
                          </Tooltip>
                          <DialogContent className="w-[calc(100%-2rem)] max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg">Token do Relatório</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Token de Validação</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={rel.token}
                                    readOnly
                                    className="font-mono text-xs sm:text-sm"
                                  />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(rel.token)}
                                        className="h-9 w-9 p-0"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copiar token</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Matrícula</Label>
                                  <p className="font-medium">{rel.matricula}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Tipo</Label>
                                  <p className="font-medium">{getTipoLabel(rel.tipo_relatorio)}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Gerado por</Label>
                                  <p className="font-medium">{rel.gerado_por_sigla || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Visualizações</Label>
                                  <p className="font-medium">{rel.visualizacoes}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
