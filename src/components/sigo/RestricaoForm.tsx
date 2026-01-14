import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Policial, 
  Restricao, 
  CodigoRestricao,
  CODIGOS_RESTRICAO 
} from "@/types";
import { 
  getPoliciaisAtivos, 
  getPolicialById,
  getRestricaoById,
  createRestricao,
  updateRestricao,
  calculateTotalDays,
  compareDates
} from "@/lib/store";

interface RestricaoFormProps {
  restricaoId?: number;
  preSelectedPolicialId?: number;
  onSuccess?: () => void;
}

export function RestricaoForm({ 
  restricaoId, 
  preSelectedPolicialId, 
  onSuccess 
}: RestricaoFormProps) {
  const { toast } = useToast();
  const isEditing = !!restricaoId;

  const [policialId, setPolicialId] = useState<string>("");
  const [codigos, setCodigos] = useState<CodigoRestricao[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const policiais = useMemo(() => getPoliciaisAtivos(), []);

  // Calculate total days
  const totalDias = useMemo(() => {
    if (dataInicio && dataFim && compareDates(dataFim, dataInicio) >= 0) {
      return calculateTotalDays(dataInicio, dataFim);
    }
    return 0;
  }, [dataInicio, dataFim]);

  // Filter codes based on search
  const filteredCodigos = useMemo(() => {
    if (!searchCode.trim()) return CODIGOS_RESTRICAO;
    const query = searchCode.toLowerCase();
    return CODIGOS_RESTRICAO.filter(
      c => c.value.toLowerCase().includes(query) || 
           c.descricao.toLowerCase().includes(query)
    );
  }, [searchCode]);

  useEffect(() => {
    if (preSelectedPolicialId) {
      setPolicialId(String(preSelectedPolicialId));
    }
  }, [preSelectedPolicialId]);

  useEffect(() => {
    if (restricaoId) {
      const restricao = getRestricaoById(restricaoId);
      if (restricao) {
        setPolicialId(String(restricao.policialId));
        setCodigos(restricao.codigos);
        setDataInicio(restricao.dataInicio);
        setDataFim(restricao.dataFim);
        setObservacao(restricao.observacao || "");
      }
    }
  }, [restricaoId]);

  const toggleCodigo = (codigo: CodigoRestricao) => {
    setCodigos(prev => 
      prev.includes(codigo) 
        ? prev.filter(c => c !== codigo)
        : [...prev, codigo]
    );
    // Clear error when user selects a code
    if (errors.codigos) {
      setErrors(prev => ({ ...prev, codigos: "" }));
    }
  };

  const removeCodigo = (codigo: CodigoRestricao) => {
    setCodigos(prev => prev.filter(c => c !== codigo));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!policialId) {
      newErrors.policialId = "Selecione um policial";
    }

    if (codigos.length === 0) {
      newErrors.codigos = "Selecione pelo menos um código de restrição";
    }

    if (!dataInicio) {
      newErrors.dataInicio = "Data início é obrigatória";
    }

    if (!dataFim) {
      newErrors.dataFim = "Data fim é obrigatória";
    }

    if (dataInicio && dataFim && compareDates(dataFim, dataInicio) < 0) {
      newErrors.dataFim = "Data fim deve ser igual ou posterior à data início";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      policialId: parseInt(policialId),
      codigos,
      dataInicio,
      dataFim,
      observacao: observacao.trim() || undefined,
    };

    let result;
    if (isEditing && restricaoId) {
      result = updateRestricao(restricaoId, data);
    } else {
      result = createRestricao(data);
    }

    if (result.success) {
      toast({
        title: "Sucesso",
        description: isEditing 
          ? "Restrição atualizada com sucesso" 
          : "Restrição registrada com sucesso",
      });
      onSuccess?.();
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const selectedPolicial = policialId ? getPolicialById(parseInt(policialId)) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Policial Selection */}
      <div className="space-y-2">
        <Label htmlFor="policial">
          Policial <span className="text-danger">*</span>
        </Label>
        <Select
          value={policialId}
          onValueChange={setPolicialId}
          disabled={!!preSelectedPolicialId}
        >
          <SelectTrigger className={errors.policialId ? "border-danger" : ""}>
            <SelectValue placeholder="Selecione um policial" />
          </SelectTrigger>
          <SelectContent>
            {policiais.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.posto} {p.re} - {p.nomeGuerra}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.policialId && (
          <p className="text-sm text-danger">{errors.policialId}</p>
        )}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">
            Data Início <span className="text-danger">*</span>
          </Label>
          <Input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className={errors.dataInicio ? "border-danger" : ""}
          />
          {errors.dataInicio && (
            <p className="text-sm text-danger">{errors.dataInicio}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataFim">
            Data Fim <span className="text-danger">*</span>
          </Label>
          <Input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className={errors.dataFim ? "border-danger" : ""}
          />
          {errors.dataFim && (
            <p className="text-sm text-danger">{errors.dataFim}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Total de Dias</Label>
          <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
            <span className="text-muted-foreground font-medium">
              {totalDias > 0 ? `${totalDias} dias` : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Codes Display */}
      {codigos.length > 0 && (
        <div className="space-y-2">
          <Label>Códigos Selecionados ({codigos.length})</Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            {codigos.map((codigo) => {
              const info = CODIGOS_RESTRICAO.find(c => c.value === codigo);
              return (
                <Badge 
                  key={codigo} 
                  variant="secondary"
                  className="badge-restricao text-sm px-2 py-1 flex items-center gap-1"
                >
                  {codigo}
                  <button
                    type="button"
                    onClick={() => removeCodigo(codigo)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Codes Selection */}
      <div className="space-y-2">
        <Label>
          Códigos de Restrição (BG PM 166/2006) <span className="text-danger">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Selecione um ou mais códigos de restrição
        </p>
        
        {/* Search */}
        <Input
          placeholder="Buscar código ou descrição..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="mb-2"
        />

        {/* Codes List */}
        <ScrollArea className={`h-60 rounded-lg border p-2 ${errors.codigos ? "border-danger" : ""}`}>
          <div className="space-y-1">
            {filteredCodigos.map((item) => {
              const isSelected = codigos.includes(item.value);
              return (
                <div
                  key={item.value}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-warning/20 border border-warning/30" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleCodigo(item.value)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleCodigo(item.value)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isSelected ? "default" : "outline"}
                        className={isSelected ? "badge-restricao" : ""}
                      >
                        {item.value}
                      </Badge>
                      <span className="text-sm">{item.descricao}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-warning" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {errors.codigos && (
          <p className="text-sm text-danger">{errors.codigos}</p>
        )}
      </div>

      {/* Observation */}
      <div className="space-y-2">
        <Label htmlFor="observacao">
          Observação <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <Textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observações adicionais (opcional)"
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {observacao.length}/500 caracteres
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" className="btn-pm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {isEditing ? "Atualizar Restrição" : "Salvar Restrição"}
        </Button>
      </div>
    </form>
  );
}
