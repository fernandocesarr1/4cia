import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Policial, PolicialFormData, POSTOS, Posto } from "@/types";
import { createPolicial, updatePolicial, getPolicialById } from "@/lib/store";

interface PolicialFormProps {
  policialId?: number;
  onSuccess?: () => void;
}

export function PolicialForm({ policialId, onSuccess }: PolicialFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!policialId;

  const [formData, setFormData] = useState<PolicialFormData>({
    re: "",
    nome: "",
    nomeGuerra: "",
    posto: "SD",
    ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (policialId) {
      const policial = getPolicialById(policialId);
      if (policial) {
        setFormData({
          re: policial.re,
          nome: policial.nome,
          nomeGuerra: policial.nomeGuerra,
          posto: policial.posto,
          ativo: policial.ativo,
        });
      }
    }
  }, [policialId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.re.trim()) {
      newErrors.re = "Este campo é obrigatório";
    }
    if (!formData.nome.trim()) {
      newErrors.nome = "Este campo é obrigatório";
    }
    if (!formData.nomeGuerra.trim()) {
      newErrors.nomeGuerra = "Este campo é obrigatório";
    }
    if (!formData.posto) {
      newErrors.posto = "Este campo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && policialId) {
        const result = updatePolicial(policialId, formData);
        if (!result.success) {
          setErrors({ re: result.error || "Erro ao atualizar" });
          return;
        }
        toast({
          title: "Sucesso",
          description: "Dados atualizados com sucesso",
        });
      } else {
        const result = createPolicial(formData);
        if (!result.success) {
          setErrors({ re: result.error || "Erro ao cadastrar" });
          return;
        }
        toast({
          title: "Sucesso",
          description: "Policial cadastrado com sucesso",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/policiais");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {isEditing ? "Editar Policial" : "Novo Policial"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize os dados do policial" : "Preencha os dados para cadastrar"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="re">RE (Registro de Efetivo) *</Label>
            <Input
              id="re"
              value={formData.re}
              onChange={(e) => setFormData({ ...formData, re: e.target.value })}
              placeholder="123456"
              className={`font-re ${errors.re ? "border-danger" : ""}`}
            />
            {errors.re && (
              <p className="text-sm text-danger">{errors.re}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="posto">Posto/Graduação *</Label>
            <Select
              value={formData.posto}
              onValueChange={(value) => setFormData({ ...formData, posto: value as Posto })}
            >
              <SelectTrigger className={errors.posto ? "border-danger" : ""}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {POSTOS.map((posto) => (
                  <SelectItem key={posto.value} value={posto.value}>
                    {posto.value} - {posto.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.posto && (
              <p className="text-sm text-danger">{errors.posto}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="João Pedro Silva Santos"
            className={errors.nome ? "border-danger" : ""}
          />
          {errors.nome && (
            <p className="text-sm text-danger">{errors.nome}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeGuerra">Nome de Guerra *</Label>
          <Input
            id="nomeGuerra"
            value={formData.nomeGuerra}
            onChange={(e) => setFormData({ ...formData, nomeGuerra: e.target.value.toUpperCase() })}
            placeholder="SILVA"
            className={errors.nomeGuerra ? "border-danger" : ""}
          />
          {errors.nomeGuerra && (
            <p className="text-sm text-danger">{errors.nomeGuerra}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="ativo"
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
          />
          <Label htmlFor="ativo" className="font-normal cursor-pointer">
            Policial ativo na corporação
          </Label>
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
    </div>
  );
}
