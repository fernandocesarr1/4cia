import { AuditoriaTable } from "@/components/sigo/AuditoriaTable";

export default function AuditoriaPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground">
          Log de todas as operações realizadas no sistema
        </p>
      </div>

      <AuditoriaTable />
    </div>
  );
}
