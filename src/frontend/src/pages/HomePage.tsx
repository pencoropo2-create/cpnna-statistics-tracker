import { PageHeader } from "@/components/layout/PageHeader";
import { useAccessSummary, useWeeks } from "@/hooks/useQueries";
import { formatCount, formatTimestamp } from "@/lib/format";
import { weekRangeLabel } from "@/lib/week";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
} from "lucide-react";

const SECTIONS = [
  {
    to: "/formato-1",
    label: "Formato 1",
    description: "Captura diaria de trámites y medidas por grupo demográfico.",
    icon: ClipboardList,
  },
  {
    to: "/formato-2",
    label: "Formato 2",
    description: "Registro complementario de actividades de la semana.",
    icon: FileSpreadsheet,
  },
  {
    to: "/panel",
    label: "Panel de Control",
    description: "Totales, promedios y alertas de auditoría de la semana.",
    icon: LayoutDashboard,
  },
  {
    to: "/reportes",
    label: "Reportes",
    description: "Consulta y edición de semanas anteriores y la actual.",
    icon: BarChart3,
  },
] as const;

/** Menú principal: acceso a Formato 1, Formato 2, Panel de Control y Reportes. */
export default function HomePage() {
  const { data: summary } = useAccessSummary();
  const { data: weeks } = useWeeks();
  const isAdmin = summary?.isAdmin ?? false;
  const recent = (weeks ?? []).slice(0, 4);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Inicio"
        title="Registro Estadístico CPNNA"
        description="Selecciona un formato para capturar o consultar la semana estadística."
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <section
          aria-label="Secciones"
          data-ocid="home.sections"
          className="grid gap-3 sm:grid-cols-2"
        >
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.to}
                to={section.to}
                data-ocid={`home.${section.to.replace(/^\//, "")}_link`}
                className="group flex items-start gap-4 rounded-lg border border-border bg-card p-5 transition-smooth hover:border-accent/50 hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-semibold text-foreground">
                      {section.label}
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {section.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </section>

        {isAdmin && (
          <Link
            to="/admin"
            data-ocid="home.admin_link"
            className="flex items-center gap-4 rounded-lg border border-warning/40 bg-warning/10 p-5 transition-smooth hover:bg-warning/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display text-base font-semibold text-foreground">
                Administración de accesos
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Aprueba solicitudes y consulta la auditoría de registros.
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
          </Link>
        )}

        <section aria-label="Semanas recientes" className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Semanas recientes
          </h2>
          {recent.length === 0 ? (
            <div
              data-ocid="home.weeks.empty_state"
              className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground"
            >
              Aún no hay semanas registradas. Comienza capturando el Formato 1.
            </div>
          ) : (
            <ul data-ocid="home.weeks.list" className="space-y-2">
              {recent.map((week, index) => (
                <li
                  key={week.id.toString()}
                  data-ocid={`home.weeks.item.${index + 1}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-foreground">
                      {weekRangeLabel(week.startDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Actualizado {formatTimestamp(week.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCount(week.totalTramites)}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        Trámites
                      </p>
                    </div>
                    {week.hasDiscrepancy && (
                      <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-warning">
                        Alerta
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
