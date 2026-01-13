import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Policial, Afastamento, POSTOS, TIPOS_AFASTAMENTO } from "@/types";
import { 
  getPolicialById, 
  getAfastamentosByPolicialId, 
  deleteAfastamento,
  formatDateBR,
  calcularStatus,
  getTodayString
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { AfastamentoForm } from "./AfastamentoForm";

export function PolicialDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [policial, setPolicial] = useState<Policial | null>(null);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [showNewAfastamento, setShowNewAfastamento] = useState(false);
  const [editingAfastamento, setEditingAfastamento] = useState<Afastamento | null>(null);
  const [deletingAfastamento, setDeletingAfastamento] = useState<Afastamento | null>(null);

  const loadData = () => {
    if (id) {
      const p = getPolicialById(parseInt(id));
      if (p) {
        setPolicial(p);
        setAfastamentos(getAfastamentosByPolicialId(p.id));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!policial) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Policial não encontrado</h2>
        <Button variant="link" onClick={() => navigate("/policiais")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  const today = getTodayString();
  const currentStatus = calcularStatus(policial.id, today);
  const postoLabel = POSTOS.find(p => p.value === policial.posto)?.label || policial.posto;

  const handleDeleteAfastamento = () => {
    if (deletingAfastamento) {
      const result = deleteAfastamento(deletingAfastamento.id);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Afastamento removido com sucesso",
        });
        loadData();
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

                  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detalhes do Policial</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os dados
          </p>
        </div>
        <Button onClick={() => navigate(`/policiais/${policial.id}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-card rounded-xl border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">RE</p>
            <p className="font-re text-lg font-bold text-primary">{policial.re}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nome Completo</p>
            <p className="font-medium">{policial.nome}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nome de Guerra</p>
            <p className="font-bold text-lg">{policial.nomeGuerra}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Posto/Graduação</p>
            <Badge variant="outline" className="text-base px-3 py-1">
              {policial.posto} - {postoLabel}
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status Atual</p>
              <Badge
                className={cn(
                  "text-base px-3 py-1",
                  currentStatus.status === "PLENO" ? "badge-pleno" : "badge-afastado"
                )}
              >
                {currentStatus.status}
              </Badge>
            </div>
            {currentStatus.afastamentoAtivo && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Afastamento Ativo</p>
                <p className="font-medium">
                  {getTipoLabel(currentStatus.afastamentoAtivo.tipo)} ({formatDateBR(currentStatus.afastamentoAtivo.dataInicio)} - {formatDateBR(currentStatus.afastamentoAtivo.dataFim)})
                </p>
              </div>
            )}
          </div>
          <Badge variant={policial.ativo ? "default" : "secondary"}>
            {policial.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Afastamentos */}
      <div className="bg-card rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Histórico de Afastamentos</h2>
            <p className="text-sm text-muted-foreground">
              {afastamentos.length} registro(s)
            </p>
          </div>
          <Button onClick={() => setShowNewAfastamento(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Afastamento
          </Button>
        </div>

        {afastamentos.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Nenhum afastamento registrado
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Este policial não possui histórico de afastamentos
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-sigo">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Data Início</th>
                  <th>Data Fim</th>
                  <th>Documento</th>
                  <th>Observação</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
              {afastamentos.map((af) => {
                  // Use pure string comparison for YYYY-MM-DD dates
                  const isAtivo = today >= af.dataInicio && today <= af.dataFim;
                  return (
                    <tr key={af.id} className={isAtivo ? "row-afastado" : ""}>
                      <td>
                        <Badge variant={isAtivo ? "destructive" : "secondary"}>
                          {getTipoLabel(af.tipo)}
                        </Badge>
                      </td>
                      <td>{formatDateBR(af.dataInicio)}</td>
                      <td>{formatDateBR(af.dataFim)}</td>
                      <td>
                        {af.documento ? (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {af.documento}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground truncate-2 max-w-xs">
                          {af.observacao || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAfastamento(af)}
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
        )}
      </div>

      {/* New Afastamento Dialog */}
      <Dialog open={showNewAfastamento} onOpenChange={setShowNewAfastamento}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Afastamento</DialogTitle>
            <DialogDescription>
              Registrar afastamento para {policial.posto} {policial.nomeGuerra}
            </DialogDescription>
          </DialogHeader>
          <AfastamentoForm
            preSelectedPolicialId={policial.id}
            onSuccess={() => {
              setShowNewAfastamento(false);
              loadData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Afastamento Dialog */}
      <Dialog open={!!editingAfastamento} onOpenChange={() => setEditingAfastamento(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Afastamento</DialogTitle>
          </DialogHeader>
          {editingAfastamento && (
            <AfastamentoForm
              afastamentoId={editingAfastamento.id}
              preSelectedPolicialId={policial.id}
              onSuccess={() => {
                setEditingAfastamento(null);
                loadData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAfastamento} onOpenChange={() => setDeletingAfastamento(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este afastamento de {deletingAfastamento && getTipoLabel(deletingAfastamento.tipo)}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAfastamento}
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
