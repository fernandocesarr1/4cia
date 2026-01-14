import { Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

// Props renomeadas conforme BG PM 166/2006
interface StatsCardsProps {
  total: number;
  aptos: number;
  afastados: number;
}

// Terminologia conforme BG PM 166/2006:
// APTO: Apto para o Serviço Policial Militar
// AFASTADO: Temporariamente inapto para o serviço
export function StatsCards({ total, aptos, afastados }: StatsCardsProps) {
  const cards = [
    {
      label: "Efetivo Total",
      value: total,
      icon: Users,
      variant: "total" as const,
      description: "Policiais ativos na unidade",
    },
    {
      label: "Aptos",
      value: aptos,
      icon: UserCheck,
      variant: "apto" as const,
      description: "Aptos para o Serviço Policial Militar",
    },
    {
      label: "Afastados",
      value: afastados,
      icon: UserX,
      variant: "afastado" as const,
      description: "Temporariamente inaptos",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "stats-card p-5 card-hover",
            card.variant === "total" && "stats-card-total",
            card.variant === "apto" && "stats-card-apto",
            card.variant === "afastado" && "stats-card-afastado"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-3xl font-bold mt-1">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded-xl",
                card.variant === "total" && "bg-primary/10 text-primary",
                card.variant === "apto" && "bg-success/20 text-success",
                card.variant === "afastado" && "bg-danger/20 text-danger"
              )}
            >
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
