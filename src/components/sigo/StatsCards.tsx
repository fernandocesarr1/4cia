import { Users, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  total: number;
  plenos: number;
  afastados: number;
}

export function StatsCards({ total, plenos, afastados }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Efetivo",
      value: total,
      icon: Users,
      variant: "total" as const,
      description: "Policiais ativos",
    },
    {
      label: "Plenos",
      value: plenos,
      icon: UserCheck,
      variant: "pleno" as const,
      description: "Disponíveis para serviço",
    },
    {
      label: "Afastados",
      value: afastados,
      icon: UserX,
      variant: "afastado" as const,
      description: "Em afastamento",
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
            card.variant === "pleno" && "stats-card-pleno",
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
                card.variant === "pleno" && "bg-success/20 text-success",
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
