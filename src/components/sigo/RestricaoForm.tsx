import { useState, useMemo } from "react";
import { AlertTriangle, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CODIGOS_RESTRICAO, CodigoRestricao } from "@/types";
import { 
  getPoliciaisAtivos, 
  getPolicialById,
  createRestricao,
  calculateTotalDays,
} from "@/lib/store";

interface RestricaoFormProps {
  restricaoId?: number;
  preSelectedPolicialId?: number;
  onSuccess?: () => void;
}

export function RestricaoForm({ 
  preSelectedPolicialId, 
  onSuccess 
}: RestricaoFormProps) {
  const { toast } = useToast();

  // Estados simples
  const [policialId, setPolicialId] = useState<string>(
    preSelectedPolicialId ? String(preSelectedPolicialId) : ""
  );
  const [selectedCodigos, setSelectedCodigos] = useState<CodigoRestricao[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Lista de policiais
  const policiais = useMemo(() => getPoliciaisAtivos(), []);

  // Filtrar códigos baseado na busca
  const filteredCodigos = useMemo(() => {
    if (!searchQuery.trim()) return CODIGOS_RESTRICAO;
    const query = searchQuery.toLowerCase();
    return CODIGOS_RESTRICAO.filter(
      c => c.value.toLowerCase().includes(query) || 
           c.descricao.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Calcular total de dias
  const totalDias = useMemo(() => {
    if (!dataInicio || !dataFim) return 0;
    if (dataFim < dataInicio) return 0;
    return calculateTotalDays(dataInicio, dataFim);
  }, [dataInicio, dataFim]);

  const handleToggleCodigo = (codigo: CodigoRestricao) => {
    setSelectedCodigos(prev => {
      if (prev.includes(codigo)) {
        return prev.filter(c => c !== codigo);
      } else {
        return [...prev, codigo];
      }
    });
  };

  const handleRemoveCodigo = (codigo: CodigoRestricao) => {
    setSelectedCodigos(prev => prev.filter(c => c !== codigo));
  };

  const handleSelectAll = () => {
    const codigosVisiveis = filteredCodigos.map(c => c.value);
    setSelectedCodigos(prev => {
      const novos = codigosVisiveis.filter(c => !prev.includes(c));
      return [...prev, ...novos] as CodigoRestricao[];
    });
  };

  const handleClearAll = () => {
    setSelectedCodigos([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validações
    if (!policialId) {
      toast({
        title: "Erro",
        description: "Selecione um policial",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (!dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Preencha as datas de início e fim",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (dataFim < dataInicio) {
      toast({
        title: "Erro",
        description: "Data fim deve ser igual ou posterior à data início",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (selectedCodigos.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um código de restrição",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Criar restrição
    const result = createRestricao({
      policialId: parseInt(policialId),
      codigos: selectedCodigos,
      dataInicio,
      dataFim,
      observacao: observacao.trim() || undefined,
    });

    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Restrição registrada com sucesso",
      });
      onSuccess?.();
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  const selectedPolicial = policialId ? getPolicialById(parseInt(policialId)) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Policial Selection */}
      <div className="space-y-2">
        <Label htmlFor="policial">
          Policial <span className="text-destructive">*</span>
        </Label>
        <Select
          value={policialId}
          onValueChange={setPolicialId}
          disabled={!!preSelectedPolicialId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um policial" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {policiais.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.posto} {p.re} - {p.nomeGuerra}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPolicial && preSelectedPolicialId && (
          <p className="text-sm text-muted-foreground">
            {selectedPolicial.posto} {selectedPolicial.re} - {selectedPolicial.nomeGuerra}
          </p>
        )}
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataInicio">
            Data Início <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataFim">
            Data Fim <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Total Dias - Calculated */}
      {totalDias > 0 && (
        <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total de dias:</span>
          <span className="font-bold text-lg">{totalDias} dias</span>
        </div>
      )}

      {/* Códigos de Restrição - Multi-select */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Códigos de Restrição <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {selectedCodigos.length} selecionado(s)
          </span>
        </div>

        {/* Códigos selecionados */}
        {selectedCodigos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-warning/10 rounded-lg border border-warning/30">
            {selectedCodigos.map((codigo) => (
              <Badge
                key={codigo}
                variant="outline"
                className="border-warning bg-warning/20 text-warning-foreground cursor-pointer hover:bg-warning/30 flex items-center gap-1"
                onClick={() => handleRemoveCodigo(codigo)}
              >
                {codigo}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Busca e ações */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar código ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
            Todos
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClearAll}>
            Limpar
          </Button>
        </div>

        {/* Lista de códigos - Layout de 2 colunas */}
        <ScrollArea className="h-64 border rounded-lg">
          <div className="p-2 grid grid-cols-2 gap-1">
            {filteredCodigos.map((codigo) => {
              const isSelected = selectedCodigos.includes(codigo.value);
              return (
                <label
                  key={codigo.value}
                  className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-warning/10 border border-warning/30" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCodigo(codigo.value)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs">{codigo.value}</span>
                      {isSelected && (
                        <Check className="h-3 w-3 text-warning shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                      {codigo.descricao}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground">
          Selecione um ou mais códigos conforme BG PM 166/2006
        </p>
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="observacao">
            Observação <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {observacao.length}/500
          </span>
        </div>
        <Textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value.slice(0, 500))}
          placeholder="Observações adicionais"
          maxLength={500}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" className="btn-pm" disabled={isSubmitting}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          {isSubmitting ? "Salvando..." : "Salvar Restrição"}
        </Button>
      </div>
    </form>
  );
}
