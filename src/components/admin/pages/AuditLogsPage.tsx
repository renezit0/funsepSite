import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Copy } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useFeedback } from "@/contexts/FeedbackContext";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

type Filters = {
  search: string;
  eventType: string;
  area: string;
  startDate: string;
  endDate: string;
};

const defaultFilters: Filters = {
  search: "",
  eventType: "all",
  area: "all",
  startDate: "",
  endDate: ""
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { mostrarToast } = useFeedback();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (filters.eventType !== "all") {
        query = query.eq("event_type", filters.eventType);
      }

      if (filters.area !== "all") {
        query = query.eq("app_area", filters.area);
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate).toISOString();
        query = query.gte("created_at", start);
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      if (filters.search) {
        const term = `%${filters.search}%`;
        query = query.or(
          `label.ilike.${term},page.ilike.${term},user_nome.ilike.${term},user_sigla.ilike.${term},event_type.ilike.${term}`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      mostrarToast("erro", "Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  }, [filters, mostrarToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = async (value: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      mostrarToast("sucesso", "Copiado para a área de transferência");
    } catch (error) {
      console.error("Erro ao copiar:", error);
      mostrarToast("erro", "Falha ao copiar");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Auditoria de Logs</CardTitle>
          <Button variant="outline" className="gap-2" onClick={loadLogs} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <Label>Buscar</Label>
              <Input
                value={filters.search}
                onChange={e => updateFilter("search", e.target.value)}
                placeholder="Página, usuário, evento"
              />
            </div>

            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={filters.eventType} onValueChange={value => updateFilter("eventType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="click">Click</SelectItem>
                  <SelectItem value="tab_view">Aba</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Área</Label>
              <Select value={filters.area} onValueChange={value => updateFilter("area", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="public">Pública</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>De</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={e => updateFilter("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Até</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={e => updateFilter("endDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
                Carregando...
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="rounded-lg border p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                    <Badge variant="outline">{log.event_type}</Badge>
                    {log.app_area && <Badge variant="secondary">{log.app_area}</Badge>}
                  </div>

                  <div className="mt-2 grid gap-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Página: </span>
                      <span className="font-medium">{log.page || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ação: </span>
                      <span className="font-medium">{log.label || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usuário: </span>
                      <span className="font-medium">{log.user_nome || "-"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.user_sigla || log.user_cargo || ""}
                    </div>
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div className="text-xs text-muted-foreground break-words">
                      {log.user_agent || "-"}
                    </div>
                    {log.user_agent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(log.user_agent)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.event_type}</Badge>
                          {log.app_area && (
                            <Badge variant="secondary">{log.app_area}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.page || "-"}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={log.label || ""}>
                        {log.label || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{log.user_nome || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.user_sigla || log.user_cargo || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="max-w-[220px] truncate text-sm text-muted-foreground">
                                {log.user_agent || "-"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[400px]">
                              {log.user_agent || "-"}
                            </TooltipContent>
                          </Tooltip>
                          {log.user_agent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(log.user_agent)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
