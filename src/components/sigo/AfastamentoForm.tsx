import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  AfastamentoFormData, 
  TipoAfastamento, 
  TIPOS_AFASTAMENTO, 
  Policial 
} from "@/types";
import { 
  createAfastamento, 
  updateAfastamento, 
  getAfastamentoById, 
  getPoliciaisAtivos,
  getPolicialById 
} from "@/lib/store";

interface AfastamentoFormProps {
  afastamentoId?: number;
  preSelectedPolicialId?: number;
  onSuccess?: () => void;
}

export function AfastamentoForm({ afastamentoId, preSelectedPolicialId, onSuccess }: AfastamentoFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isEditing = !!afastamentoId;

  const policialIdFromUrl = searchParams.get("policialId");
  const initialPolicialId = preSelectedPolicialId || (policialIdFromUrl ? parseInt(policialIdFromUrl) : 0);

  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [formData, setFormData] = useState<AfastamentoFormData>({
    policialId: initialPolicialId,
    tipo: "MEDICO",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    documento: "",
    observacao: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPoliciais(getPoliciaisAtivos());
  }, []);

  useEffect(() => {
    if (afastamentoId) {
      const afastamento = getAfastamentoById(afastamentoId);
      if (afastamento) {
        setFormData({
          policialId: afastamento.policialId,
          tipo: afastamento.tipo,
          dataInicio: afastamento.dataInicio,
          dataFim: afastamento.dataFim,
          documento: afastamento.documento || "",
          observacao: afastamento.observacao || "",
        });
      }
    }
  }, [afastamentoId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.policialId) {
      newErrors.policialId = "Este campo é obrigatório";
    }
    if (!formData.tipo) {
      newErrors.tipo = "Este campo é obrigatório";
    }
    if (!formData.dataInicio) {
      newErrors.dataInicio = "Este campo é obrigatório";
    }
    if (!formData.dataFim) {
      newErrors.dataFim = "Este campo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setConflictError(null);

    try {
      if (isEditing && afastamentoId) {
        const result = updateAfastamento(afastamentoId, formData);
        if (!result.success) {
          if (result.error?.includes("Já existe")) {
            setConflictError(result.error);
          } else {
            setErrors({ general: result.error || "Erro ao atualizar" });
          }
          return;
        }
        toast({
          title: "Sucesso",
          description: "Afastamento atualizado com sucesso",
        });
      } else {
        const result = createAfastamento(formData);
        if (!result.success) {
          if (result.error?.includes("Já existe")) {
            setConflictError(result.error);
          } else if (result.error?.includes("Data fim")) {
            setErrors({ dataFim: result.error });
          } else {
            setErrors({ general: result.error || "Erro ao cadastrar" });
          }
          return;
        }
        toast({
          title: "Sucesso",
          description: "Afastamento registrado com sucesso",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(-1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPolicial = formData.policialId ? getPolicialById(formData.policialId) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Afastamento" : "Novo Afastamento"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize os dados do afastamento" : "Registre um novo afastamento"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-6">
        {errors.general && (
          <div className="p-4 bg-danger-light border border-danger/30 rounded-lg text-danger text-sm">
            {errors.general}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="policialId">Policial *</Label>
          <Select
            value={formData.policialId?.toString() || ""}
            onValueChange={(value) => setFormData({ ...formData, policialId: parseInt(value) })}
            disabled={!!preSelectedPolicialId}
          >
            <SelectTrigger className={errors.policialId ? "border-danger" : ""}>
              <SelectValue placeholder="Selecione o policial..." />
            </SelectTrigger>
            <SelectContent>
              {policiais.map((policial) => (
                <SelectItem key={policial.id} value={policial.id.toString()}>
                  <span className="font-re mr-2">{policial.re}</span>
                  <span>{policial.posto} {policial.nomeGuerra}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.policialId && (
            <p className="text-sm text-danger">{errors.policialId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Afastamento *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoAfastamento })}
          >
            <SelectTrigger className={errors.tipo ? "border-danger" : ""}>
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_AFASTAMENTO.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-danger">{errors.tipo}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início *</Label>
            <Input
              id="dataInicio"
              type="date"
              value={formData.dataInicio}
              onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
              className={errors.dataInicio ? "border-danger" : ""}
            />
            {errors.dataInicio && (
              <p className="text-sm text-danger">{errors.dataInicio}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim *</Label>
            <Input
              id="dataFim"
              type="date"
              value={formData.dataFim}
              onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
              className={errors.dataFim ? "border-danger" : ""}
            />
            {errors.dataFim && (
              <p className="text-sm text-danger">{errors.dataFim}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documento">Documento (opcional)</Label>
          <Input
            id="documento"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            placeholder="Ex: Atestado 12345, Portaria 001/2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacao">Observação (opcional)</Label>
          <Textarea
            id="observacao"
            value={formData.observacao}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            placeholder="Informações adicionais sobre o afastamento..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-pm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>

      {/* Conflict Modal */}
      <Dialog open={!!conflictError} onOpenChange={() => setConflictError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              Conflito de Datas
            </DialogTitle>
            <DialogDescription className="pt-2">
              {conflictError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConflictError(null)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
