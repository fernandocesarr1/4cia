import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  getPoliciaisAtivos, 
  getPolicialById,
  createRestricaoFromString,
} from "@/lib/store";

interface RestricaoFormProps {
  restricaoId?: number;
  preSelectedPolicialId?: number;
  onSuccess?: () => void;
}

// Lista de códigos válidos para referência do usuário
const CODIGOS_VALIDOS = "AA, AB, AC, AD, AE, AF, AG, AH, AI, AJ, CF, CM, CP, DC, DI, EC, EF, EM, ES, FA, FF, FV, LP, ME, MO, PC, PE, PI, PO, PV, RC, RD, RP, SE, SP, SV, TF, TP, TR, UA, UU, VB, VP";

export function RestricaoForm({ 
  preSelectedPolicialId, 
  onSuccess 
}: RestricaoFormProps) {
  const { toast } = useToast();

  // Estados simples - apenas strings
  const [policialId, setPolicialId] = useState<string>(
    preSelectedPolicialId ? String(preSelectedPolicialId) : ""
  );
  const [codigosText, setCodigosText] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de policiais (carregada uma vez, sem reatividade complexa)
  const policiais = getPoliciaisAtivos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validações básicas no frontend
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

    if (!codigosText.trim()) {
      toast({
        title: "Erro",
        description: "Digite pelo menos um código de restrição",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Enviar para o "backend" (store) que faz a validação completa
    const result = createRestricaoFromString({
      policialId: parseInt(policialId),
      codigosString: codigosText,
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
          <SelectContent>
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

      {/* Códigos - Textarea simples */}
      <div className="space-y-2">
        <Label htmlFor="codigos">
          Códigos de Restrição <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="codigos"
          value={codigosText}
          onChange={(e) => setCodigosText(e.target.value)}
          placeholder="Exemplo: EF, LP, PO, SP"
          rows={2}
          required
        />
        <p className="text-xs text-muted-foreground">
          Digite os códigos separados por vírgula. Códigos válidos (BG PM 166/2006):
        </p>
        <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
          {CODIGOS_VALIDOS}
        </p>
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">
          Observação <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <Textarea
          id="observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
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
