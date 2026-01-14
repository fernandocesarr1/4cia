import { Eye, Plus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PolicialComStatus, TIPOS_AFASTAMENTO } from "@/types";
import { formatDateBR } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PolicialTableProps {
  policiais: PolicialComStatus[];
  onViewDetails: (id: number) => void;
  onNewAfastamento: (id: number) => void;
}

export function PolicialTable({ policiais, onViewDetails, onNewAfastamento }: PolicialTableProps) {
  if (policiais.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-12 text-center">
        <UserX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
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
              <th>Afastamento Ativo</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {policiais.map((policial) => {
              const isAfastado = policial.statusResult.status === "AFASTADO";
              const afastamento = policial.statusResult.afastamentoAtivo;

              // Status conforme BG PM 166/2006
              return (
                <tr
                  key={policial.id}
                  className={cn(
                    "animate-fade-in",
                    isAfastado ? "row-afastado" : "row-apto"
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
                    {/* Badge com terminologia BG PM 166/2006 */}
                    <Badge
                      className={cn(
                        "font-medium",
                        isAfastado ? "badge-afastado" : "badge-apto"
                      )}
                    >
                      {policial.statusResult.status === "APTO" ? "✓ APTO" : "✕ AFASTADO"}
                    </Badge>
                  </td>
                  <td>
                    {afastamento ? (
                      <span className="text-sm">
                        <span className="font-medium">{getTipoLabel(afastamento.tipo)}</span>
                        <span className="text-muted-foreground ml-1">
                          ({formatDateBR(afastamento.dataInicio)} - {formatDateBR(afastamento.dataFim)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
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
                        onClick={() => onNewAfastamento(policial.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Afastamento
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
