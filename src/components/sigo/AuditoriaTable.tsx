import { useState, useMemo } from "react";
import { Download, Filter, Search, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditoriaLog } from "@/types";
import { getAuditoriaLogsFiltered, formatDateTimeBR } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AuditoriaTable() {
  const [entidadeFilter, setEntidadeFilter] = useState<string>("todos");
  const [dataInicioFilter, setDataInicioFilter] = useState<string>("");
  const [dataFimFilter, setDataFimFilter] = useState<string>("");
  const [usuarioFilter, setUsuarioFilter] = useState<string>("");

  const logs = useMemo(() => {
    return getAuditoriaLogsFiltered(
      entidadeFilter as "policiais" | "afastamentos" | "restricoes" | "todos",
      dataInicioFilter || undefined,
      dataFimFilter || undefined,
      usuarioFilter || undefined
    );
  }, [entidadeFilter, dataInicioFilter, dataFimFilter, usuarioFilter]);

  const handleExportCSV = () => {
    const headers = ["Data/Hora", "Usuário", "Entidade", "Ação", "Descrição"];
    const rows = logs.map(log => [
      formatDateTimeBR(log.dataHora),
      log.usuarioEmail,
      log.entidade,
      log.acao,
      log.descricaoHumana,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAcaoBadgeVariant = (acao: string) => {
    switch (acao) {
      case "CREATE":
        return "bg-success text-success-foreground";
      case "UPDATE":
        return "bg-warning text-warning-foreground";
      case "DELETE":
        return "bg-danger text-danger-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case "CREATE":
        return "Criação";
      case "UPDATE":
        return "Atualização";
      case "DELETE":
        return "Exclusão";
      default:
        return acao;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Entidade</Label>
            <Select value={entidadeFilter} onValueChange={setEntidadeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="policiais">Policiais</SelectItem>
                <SelectItem value="afastamentos">Afastamentos</SelectItem>
                <SelectItem value="restricoes">Restrições</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={dataInicioFilter}
              onChange={(e) => setDataInicioFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={dataFimFilter}
              onChange={(e) => setDataFimFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input
              placeholder="Buscar por email..."
              value={usuarioFilter}
              onChange={(e) => setUsuarioFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} registro(s) encontrado(s)
        </p>
        <Button variant="outline" onClick={handleExportCSV} disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Nenhum registro encontrado
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Ajuste os filtros ou aguarde novas operações
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-sigo">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Entidade</th>
                  <th>Ação</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="animate-fade-in">
                    <td className="whitespace-nowrap">
                      {formatDateTimeBR(log.dataHora)}
                    </td>
                    <td className="font-mono text-sm">
                      {log.usuarioEmail}
                    </td>
                    <td>
                      <Badge variant="outline" className="capitalize">
                        {log.entidade}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={cn(getAcaoBadgeVariant(log.acao))}>
                        {getAcaoLabel(log.acao)}
                      </Badge>
                    </td>
                    <td className="max-w-md">
                      <span className="text-sm">{log.descricaoHumana}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
