import { Card } from "@/components/ui/card";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AlertTriangle, ClipboardList, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardsProps {
  totalUsuarios: bigint;
  totalTramites: bigint;
  openGaps: number;
  loading?: boolean;
}

interface KpiSpec {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "warning";
}

const TONE_CLASSES: Record<KpiSpec["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  warning: "bg-warning/20 text-warning",
};

/** Tarjetas de KPI de la semana activa: usuarios, trámites y brechas abiertas. */
export function KpiCards({
  totalUsuarios,
  totalTramites,
  openGaps,
  loading = false,
}: KpiCardsProps) {
  const specs: KpiSpec[] = [
    {
      key: "usuarios",
      label: "Usuarios atendidos",
      value: formatCount(totalUsuarios),
      hint: "Total reportado en la semana",
      icon: Users,
      tone: "primary",
    },
    {
      key: "tramites",
      label: "Trámites registrados",
      value: formatCount(totalTramites),
      hint: "Carga operativa acumulada",
      icon: ClipboardList,
      tone: "accent",
    },
    {
      key: "brechas",
      label: "Brechas de validación",
      value: formatCount(BigInt(openGaps)),
      hint:
        openGaps === 0
          ? "Sin discrepancias demográficas"
          : "Días con desglose inconsistente",
      icon: AlertTriangle,
      tone: openGaps > 0 ? "warning" : "accent",
    },
  ];

  return (
    <div
      data-ocid="panel.kpi_section"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <Card
            key={spec.key}
            data-ocid={`panel.kpi_card.${spec.key}`}
            className="gap-3 rounded-lg border-border py-4 shadow-subtle"
          >
            <div className="flex items-start justify-between gap-3 px-4">
              <div className="min-w-0 space-y-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  {spec.label}
                </p>
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="font-display text-3xl font-bold tabular-nums text-foreground">
                    {spec.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{spec.hint}</p>
              </div>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  TONE_CLASSES[spec.tone],
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
