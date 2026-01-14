import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Policial, POSTOS } from "@/types";
import { getPoliciais, deletePolicial, calcularStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function PoliciaisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingPolicial, setDeletingPolicial] = useState<Policial | null>(null);

  const loadPoliciais = () => {
    setPoliciais(getPoliciais());
  };

  useEffect(() => {
    loadPoliciais();
  }, []);

  const filteredPoliciais = useMemo(() => {
    if (!searchQuery.trim()) return policiais;
    
    const query = searchQuery.toLowerCase();
    return policiais.filter(p => 
      p.re.toLowerCase().includes(query) ||
      p.nomeGuerra.toLowerCase().includes(query) ||
      p.nome.toLowerCase().includes(query)
    );
  }, [policiais, searchQuery]);

  const handleDelete = () => {
    if (deletingPolicial) {
      const result = deletePolicial(deletingPolicial.id);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Policial removido com sucesso",
        });
        loadPoliciais();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
      setDeletingPolicial(null);
    }
  };

  const getPostoLabel = (posto: string) => {
    return POSTOS.find(p => p.value === posto)?.label || posto;
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Policiais</h1>
          <p className="text-muted-foreground">
            Gerenciamento do efetivo ({policiais.length} registros)
          </p>
        </div>
        
        <Button onClick={() => navigate("/policiais/novo")} className="btn-pm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Policial
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por RE, nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-sigo">
            <thead>
              <tr>
                <th>RE</th>
                <th>Nome de Guerra</th>
                <th>Nome Completo</th>
                <th>Posto</th>
                <th>Status</th>
                <th>Situação</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoliciais.map((policial) => {
                const status = calcularStatus(policial.id, today);
                return (
                  <tr 
                    key={policial.id}
                    className={cn(
                      "animate-fade-in",
                      !policial.ativo && "opacity-60"
                    )}
                  >
                    <td>
                      <span className="font-re font-medium text-primary">
                        {policial.re}
                      </span>
                    </td>
                    <td className="font-medium">{policial.nomeGuerra}</td>
                    <td className="text-muted-foreground">{policial.nome}</td>
                    <td>
                      <Badge variant="outline">
                        {policial.posto} - {getPostoLabel(policial.posto)}
                      </Badge>
                    </td>
                    <td>
                      {/* Badge com terminologia BG PM 166/2006 */}
                      <Badge
                        className={cn(
                          status.status === "APTO" ? "badge-apto" : "badge-afastado"
                        )}
                      >
                        {status.status === "APTO" ? "✓ APTO" : "✕ AFASTADO"}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={policial.ativo ? "default" : "secondary"}>
                        {policial.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/policiais/${policial.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/policiais/${policial.id}/editar`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingPolicial(policial)}
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

        {filteredPoliciais.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum resultado encontrado" : "Nenhum policial cadastrado"}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPolicial} onOpenChange={() => setDeletingPolicial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o policial{" "}
              <strong>{deletingPolicial?.posto} {deletingPolicial?.nomeGuerra}</strong> (RE: {deletingPolicial?.re})?
              <br /><br />
              Esta ação também removerá todos os afastamentos associados e não pode ser desfeita.
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
