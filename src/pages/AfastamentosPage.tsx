import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Edit, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Afastamento, TIPOS_AFASTAMENTO } from "@/types";
import { 
  getAfastamentos, 
  getPolicialById, 
  deleteAfastamento, 
  formatDateBR,
  getTodayString,
  compareDates
} from "@/lib/store";
import { cn } from "@/lib/utils";

interface AfastamentoWithPolicial extends Afastamento {
  policialRe: string;
  policialNome: string;
  policialPosto: string;
}

export default function AfastamentosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [afastamentos, setAfastamentos] = useState<AfastamentoWithPolicial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [deletingAfastamento, setDeletingAfastamento] = useState<AfastamentoWithPolicial | null>(null);

  const loadAfastamentos = () => {
    const raw = getAfastamentos();
    const enriched = raw.map(af => {
      const policial = getPolicialById(af.policialId);
      return {
        ...af,
        policialRe: policial?.re || "",
        policialNome: policial?.nomeGuerra || "",
        policialPosto: policial?.posto || "",
      };
    }).sort((a, b) => compareDates(b.dataInicio, a.dataInicio));
    setAfastamentos(enriched);
  };

  useEffect(() => {
    loadAfastamentos();
  }, []);

  const filteredAfastamentos = useMemo(() => {
    let result = afastamentos;

    if (tipoFilter !== "todos") {
      result = result.filter(af => af.tipo === tipoFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(af =>
        af.policialRe.toLowerCase().includes(query) ||
        af.policialNome.toLowerCase().includes(query) ||
        af.documento?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [afastamentos, searchQuery, tipoFilter]);

  const handleDelete = () => {
    if (deletingAfastamento) {
      const result = deleteAfastamento(deletingAfastamento.id);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Afastamento removido com sucesso",
        });
        loadAfastamentos();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
      setDeletingAfastamento(null);
    }
  };

  const getTipoLabel = (tipo: string) => {
    return TIPOS_AFASTAMENTO.find(t => t.value === tipo)?.label || tipo;
  };

  const isAtivo = (af: Afastamento) => {
    const today = getTodayString();
    return today >= af.dataInicio && today <= af.dataFim;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Afastamentos</h1>
          <p className="text-muted-foreground">
            Gerenciamento de afastamentos ({afastamentos.length} registros)
          </p>
        </div>
        
        <Button onClick={() => navigate("/afastamentos/novo")} className="btn-pm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Afastamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por RE, nome ou documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_AFASTAMENTO.map(tipo => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredAfastamentos.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Nenhum afastamento encontrado
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {searchQuery || tipoFilter !== "todos" 
              ? "Ajuste os filtros para ver mais resultados" 
              : "Registre afastamentos para começar"
            }
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-sigo">
              <thead>
                <tr>
                  <th>Policial</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Documento</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAfastamentos.map((af) => {
                  const ativo = isAtivo(af);
                  return (
                    <tr 
                      key={af.id}
                      className={cn("animate-fade-in", ativo && "row-afastado")}
                    >
                      <td>
                        <div>
                          <span className="font-re text-primary mr-2">{af.policialRe}</span>
                          <span className="font-medium">{af.policialPosto} {af.policialNome}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline">{getTipoLabel(af.tipo)}</Badge>
                      </td>
                      <td>
                        <span className="whitespace-nowrap">
                          {formatDateBR(af.dataInicio)} - {formatDateBR(af.dataFim)}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted-foreground">
                          {af.documento || "-"}
                        </span>
                      </td>
                      <td>
                        <Badge className={ativo ? "badge-afastado" : "bg-muted text-muted-foreground"}>
                          {ativo ? "Ativo" : "Encerrado"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/policiais/${af.policialId}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingAfastamento(af)}
                            className="text-danger hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAfastamento} onOpenChange={() => setDeletingAfastamento(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este afastamento de{" "}
              <strong>{deletingAfastamento && getTipoLabel(deletingAfastamento.tipo)}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
