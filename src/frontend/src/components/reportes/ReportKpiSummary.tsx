import type { WeeklyReport } from "@/lib/report";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReportKpiSummaryProps {
  report: WeeklyReport;
}

/** Tarjetas de KPIs del consolidado semanal. */
export function ReportKpiSummary({ report }: ReportKpiSummaryProps) {
  return (
    <div
      data-ocid="reportes.kpi_summary"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {report.kpis.map((kpi, index) => {
        const isAlert = kpi.label === "Días con discrepancia";
        const hasAlerts = report.alerts.length > 0;
        return (
          <div
            key={kpi.label}
            data-ocid={`reportes.kpi.${index + 1}`}
            className={cn(
              "flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-subtle sm:p-4",
              isAlert && hasAlerts ? "border-warning/50" : "border-border",
            )}
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">
              {kpi.value}
            </span>
            {kpi.hint && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isAlert && hasAlerts
                    ? "text-warning"
                    : "text-muted-foreground",
                )}
              >
                {isAlert &&
                  (hasAlerts ? (
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ))}
                {kpi.hint}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
