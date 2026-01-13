import { Afastamento, TIPOS_AFASTAMENTO } from "@/types";
import { cn } from "@/lib/utils";

interface AfastamentoStatsProps {
  afastamentosAtivos: Afastamento[];
}

export function AfastamentoStats({ afastamentosAtivos }: AfastamentoStatsProps) {
  if (afastamentosAtivos.length === 0) {
    return null;
  }

  const countByType = TIPOS_AFASTAMENTO.map(tipo => ({
    ...tipo,
    count: afastamentosAtivos.filter(a => a.tipo === tipo.value).length,
  })).filter(t => t.count > 0);

  const colors: Record<string, string> = {
    FERIAS: "bg-blue-500",
    MEDICO: "bg-red-500",
    LICENCA: "bg-amber-500",
    CURSO: "bg-purple-500",
    OUTROS: "bg-gray-500",
  };

  return (
    <div className="bg-card rounded-xl border p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Afastamentos Ativos por Tipo
      </h3>
      <div className="flex flex-wrap gap-3">
        {countByType.map(tipo => (
          <div
            key={tipo.value}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg"
          >
            <div className={cn("w-2.5 h-2.5 rounded-full", colors[tipo.value])} />
            <span className="text-sm font-medium">{tipo.count}</span>
            <span className="text-sm text-muted-foreground">{tipo.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
