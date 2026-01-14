import { Eye, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PolicialComStatus, TIPOS_AFASTAMENTO, CODIGOS_RESTRICAO } from "@/types";
import { formatDateBR } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PolicialTableProps {
  policiais: PolicialComStatus[];
  onViewDetails: (id: number) => void;
  onNewAfastamento: (id: number) => void;
  onNewRestricao: (id: number) => void;
}

export function PolicialTable({ 
  policiais, 
  onViewDetails, 
  onNewAfastamento,
  onNewRestricao 
}: PolicialTableProps) {
  if (policiais.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Nenhum policial encontrado
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Adicione policiais para começar a gerenciar o efetivo
        </p>
      </div>
    );
  }

  const getTipoLabel = (tipo: string) => {
    return TIPOS_AFASTAMENTO.find(t => t.value === tipo)?.label || tipo;
  };

  const getCodigosTooltip = (codigos: string[]) => {
    return codigos.map(c => {
      const info = CODIGOS_RESTRICAO.find(cr => cr.value === c);
      return info ? `${c} - ${info.descricao}` : c;
    }).join("\n");
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-sigo">
          <thead>
            <tr>
              <th>RE</th>
              <th>Nome de Guerra</th>
              <th>Posto</th>
              <th>Status</th>
              <th>Detalhes</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {policiais.map((policial) => {
              const { status, afastamentoAtivo, restricaoAtiva } = policial.statusResult;

              return (
                <tr
                  key={policial.id}
                  className={cn(
                    "animate-fade-in",
                    status === "AFASTADO" && "row-afastado",
                    status === "APTO_COM_RESTRICAO" && "row-restricao",
                    status === "APTO" && "row-apto"
                  )}
                >
                  <td>
                    <span className="font-re font-medium text-primary">
                      {policial.re}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium">{policial.nomeGuerra}</span>
                  </td>
                  <td>
                    <Badge variant="outline" className="font-medium">
                      {policial.posto}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      className={cn(
                        "font-medium",
                        status === "APTO" && "badge-apto",
                        status === "APTO_COM_RESTRICAO" && "badge-restricao",
                        status === "AFASTADO" && "badge-afastado"
                      )}
                    >
                      {status === "APTO" && "✓ APTO"}
                      {status === "APTO_COM_RESTRICAO" && "⚠ APTO COM RESTRIÇÃO"}
                      {status === "AFASTADO" && "✕ AFASTADO"}
                    </Badge>
                  </td>
                  <td>
                    {afastamentoAtivo && (
                      <span className="text-sm">
                        <span className="font-medium">{getTipoLabel(afastamentoAtivo.tipo)}</span>
                        <span className="text-muted-foreground ml-1">
                          ({formatDateBR(afastamentoAtivo.dataInicio)} - {formatDateBR(afastamentoAtivo.dataFim)})
                        </span>
                      </span>
                    )}
                    {restricaoAtiva && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm cursor-help">
                            <span className="font-medium text-warning">
                              {restricaoAtiva.codigos.join(", ")}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              ({restricaoAtiva.totalDias} dias)
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-line">
                          {getCodigosTooltip(restricaoAtiva.codigos)}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!afastamentoAtivo && !restricaoAtiva && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(policial.id)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNewRestricao(policial.id)}
                        className="text-warning hover:text-warning hover:bg-warning/10"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNewAfastamento(policial.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
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
  );
}
