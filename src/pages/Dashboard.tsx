import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Download, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StatsCards } from "@/components/sigo/StatsCards";
import { PolicialTable } from "@/components/sigo/PolicialTable";
import { AfastamentoStats } from "@/components/sigo/AfastamentoStats";
import { PolicialComStatus, Afastamento } from "@/types";
import { 
  getPoliciaisAtivos, 
  getAfastamentos, 
  calcularStatus, 
  exportData,
  seedDemoData 
} from "@/lib/store";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dataReferencia, setDataReferencia] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [policiais, setPoliciais] = useState<PolicialComStatus[]>([]);

  useEffect(() => {
    // Seed demo data on first load
    seedDemoData();
    loadPoliciais();
  }, [dataReferencia]);

  const loadPoliciais = () => {
    const ativos = getPoliciaisAtivos();
    const policiaisComStatus = ativos.map(p => ({
      ...p,
      statusResult: calcularStatus(p.id, dataReferencia),
    }));
    setPoliciais(policiaisComStatus);
  };

  const filteredPoliciais = useMemo(() => {
    if (!searchQuery.trim()) return policiais;
    
    const query = searchQuery.toLowerCase();
    return policiais.filter(p => 
      p.re.toLowerCase().includes(query) ||
      p.nomeGuerra.toLowerCase().includes(query) ||
      p.nome.toLowerCase().includes(query)
    );
  }, [policiais, searchQuery]);

  const stats = useMemo(() => {
    const total = policiais.length;
    const plenos = policiais.filter(p => p.statusResult.status === "PLENO").length;
    const afastados = policiais.filter(p => p.statusResult.status === "AFASTADO").length;
    return { total, plenos, afastados };
  }, [policiais]);

  const afastamentosAtivos = useMemo(() => {
    return policiais
      .filter(p => p.statusResult.afastamentoAtivo)
      .map(p => p.statusResult.afastamentoAtivo as Afastamento);
  }, [policiais]);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sigo_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: "Arquivo JSON gerado com sucesso",
    });
  };

  const handleViewDetails = (id: number) => {
    navigate(`/policiais/${id}`);
  };

  const handleNewAfastamento = (id: number) => {
    navigate(`/afastamentos/novo?policialId=${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do efetivo da 4ª Companhia
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="dataRef" className="text-sm whitespace-nowrap">
              Consultar efetivo em:
            </Label>
            <Input
              id="dataRef"
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className="w-auto border-0 p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        total={stats.total}
        plenos={stats.plenos}
        afastados={stats.afastados}
      />

      {/* Afastamentos Stats */}
      <AfastamentoStats afastamentosAtivos={afastamentosAtivos} />

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por RE ou nome de guerra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Button onClick={() => navigate("/policiais/novo")} className="btn-pm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Policial
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredPoliciais.length} resultado(s) para "{searchQuery}"
        </p>
      )}

      {/* Table */}
      <PolicialTable
        policiais={filteredPoliciais}
        onViewDetails={handleViewDetails}
        onNewAfastamento={handleNewAfastamento}
      />
    </div>
  );
}
