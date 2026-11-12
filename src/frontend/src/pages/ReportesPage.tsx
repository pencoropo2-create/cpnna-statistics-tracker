import { createActor } from "@/backend";
import { WeekSelector } from "@/components/WeekSelector";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportEmailPanel } from "@/components/reportes/ReportEmailPanel";
import { ReportKpiSummary } from "@/components/reportes/ReportKpiSummary";
import { ReportPreview } from "@/components/reportes/ReportPreview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTramites, useWeek, useWeeks } from "@/hooks/useQueries";
import { useWeekStore } from "@/hooks/useWeekStore";
import {
  buildReportSheets,
  buildWeeklyReport,
  reportFileName,
} from "@/lib/report";
import { weekRangeLabel } from "@/lib/week";
import { downloadXlsx } from "@/lib/xlsx";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

/**
 * Reportes — vista previa y exportación del consolidado semanal.
 * Genera el archivo .xlsx con Formato 1, Formato 2 y el resumen de KPIs,
 * y permite enviarlo por correo institucional.
 */
export default function ReportesPage() {
  const { weekStart, setWeekStart } = useWeekStore();
  const { data: weeks, isLoading: weeksLoading } = useWeeks();
  const { data: tramites } = useTramites();

  const activeWeekId = useMemo(() => {
    const match = weeks?.find((week) => week.startDate === weekStart);
    return match?.id ?? null;
  }, [weeks, weekStart]);

  const { data: week, isLoading: weekLoading } = useWeek(activeWeekId);

  const { actor, isFetching } = useActor(createActor);
  const { data: totals } = useQuery({
    queryKey: ["weekTotals", activeWeekId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || activeWeekId === null) return null;
      return actor.getWeekTotals(activeWeekId);
    },
    enabled: !!actor && !isFetching && activeWeekId !== null,
  });
  const { data: alerts } = useQuery({
    queryKey: ["weekAlerts", activeWeekId?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || activeWeekId === null) return [];
      return actor.getWeekAlerts(activeWeekId);
    },
    enabled: !!actor && !isFetching && activeWeekId !== null,
  });

  const report = useMemo(() => {
    if (!week || !tramites) return null;
    return buildWeeklyReport(week, tramites, totals ?? null, alerts ?? []);
  }, [week, tramites, totals, alerts]);

  const isLoading = weeksLoading || (activeWeekId !== null && weekLoading);

  function handleDownload() {
    if (!report) return;
    downloadXlsx(reportFileName(report.weekStart), buildReportSheets(report));
    toast.success("Consolidado descargado", {
      description: reportFileName(report.weekStart),
    });
  }

  async function handleSend(email: string): Promise<string | null> {
    if (!actor || activeWeekId === null) {
      return "No se pudo identificar la semana a enviar. Vuelve a intentarlo.";
    }
    try {
      const result = await actor.sendWeekReportEmail(activeWeekId, email);
      if (result.__kind__ === "ok") {
        toast.success("Consolidado enviado", { description: email });
        return null;
      }
      return result.err;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No se pudo enviar el consolidado. Inténtalo de nuevo.";
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Reportes"
        title="Consolidado semanal"
        description="Vista previa del reporte y exportación a Excel con Formato 1, Formato 2 y KPIs."
        actions={
          <Button
            type="button"
            data-ocid="reportes.download_button"
            onClick={handleDownload}
            disabled={!report}
            className="h-10 rounded-lg px-4"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar .xlsx
          </Button>
        }
      />
      <WeekSelector weekStart={weekStart} onChange={setWeekStart} />

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {isLoading ? (
          <ReportSkeleton />
        ) : !report ? (
          <EmptyReport weekStart={weekStart} />
        ) : (
          <>
            <ReportKpiSummary report={report} />

            <section
              data-ocid="reportes.preview.section"
              className="space-y-3"
              aria-label="Vista previa del consolidado"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  Vista previa del reporte
                </h2>
              </div>
              <ReportPreview report={report} />
            </section>

            <ReportEmailPanel
              report={report}
              onSend={handleSend}
              available={!!actor && !isFetching && activeWeekId !== null}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ReportSkeleton() {
  const ids = Array.from({ length: 6 }, (_, i) => `report-skeleton-${i}`);
  return (
    <div data-ocid="reportes.loading_state" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ids.slice(0, 4).map((id) => (
          <Skeleton key={id} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}

function EmptyReport({ weekStart }: { weekStart: string }) {
  return (
    <div
      data-ocid="reportes.empty_state"
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileSpreadsheet className="size-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h2 className="font-display text-base font-semibold text-foreground">
          Sin datos para esta semana
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          No hay un registro capturado para la semana{" "}
          {weekRangeLabel(weekStart)}. Captura el Formato 1 y el Formato 2 para
          generar el consolidado.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        data-ocid="reportes.empty_state.retry_button"
        onClick={() => window.location.reload()}
        className="h-10 rounded-lg px-4"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        Actualizar
      </Button>
    </div>
  );
}
