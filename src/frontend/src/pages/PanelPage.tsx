import { createActor } from "@/backend";
import type { AuditAlert, TramiteCategory, WeekDay, WeekId } from "@/backend";
import { WeekSelector } from "@/components/WeekSelector";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgeDistributionChart } from "@/components/panel/AgeDistributionChart";
import type { AgeSlice } from "@/components/panel/AgeDistributionChart";
import { AuditAlerts } from "@/components/panel/AuditAlerts";
import { DailyComparisonChart } from "@/components/panel/DailyComparisonChart";
import type { DailyPoint } from "@/components/panel/DailyComparisonChart";
import { KpiCards } from "@/components/panel/KpiCards";
import { TramiteRanking } from "@/components/panel/TramiteRanking";
import type { RankingRow } from "@/components/panel/TramiteRanking";
import {
  AGE_RANGE_LABELS,
  AGE_RANGE_ORDER,
  AGE_RANGE_SHORT,
} from "@/components/panel/ageRange";
import { useTramites, useWeeks } from "@/hooks/useQueries";
import { useWeekStore } from "@/hooks/useWeekStore";
import { WEEK_DAYS, WEEK_DAY_SHORT, weekDates } from "@/lib/week";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

const CATEGORY_LABELS: Record<TramiteCategory, string> = {
  remision: "Remisión",
  psicologia: "Psicología",
  otra: "Otra",
  medidaCuidado: "Medida de cuidado",
  autorizacionViajeNacional: "Viaje nacional",
  aperturaCausa: "Apertura de causa",
  medidaResponsabilidad: "Medida de responsabilidad",
  constatacion: "Constatación",
  autorizacionViajeInternacional: "Viaje internacional",
};

const AGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Totales de la semana activa (por trámite, por día y por grupo etario). */
function useWeekTotals(id: WeekId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["weekTotals", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getWeekTotals(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/** Alertas de auditoría de la semana activa. */
function useWeekAlerts(id: WeekId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditAlert[]>({
    queryKey: ["weekAlerts", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return [];
      return actor.getWeekAlerts(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/**
 * Panel de Control — KPIs, ranking, gráficos y alertas de auditoría
 * de la semana estadística activa (Viernes → Jueves).
 */
export default function PanelPage() {
  const { weekStart, setWeekStart, setActiveDay } = useWeekStore();
  const navigate = useNavigate();

  const { data: weeks, isLoading: weeksLoading } = useWeeks();
  const { data: tramites } = useTramites();

  const activeWeekId = useMemo<WeekId | null>(() => {
    const match = weeks?.find((week) => week.startDate === weekStart);
    return match ? match.id : null;
  }, [weeks, weekStart]);

  const { data: totals, isLoading: totalsLoading } =
    useWeekTotals(activeWeekId);
  const { data: alerts, isLoading: alertsLoading } =
    useWeekAlerts(activeWeekId);

  const tramiteNames = useMemo(() => {
    const map = new Map<string, { name: string; category: string }>();
    for (const tramite of tramites ?? []) {
      map.set(tramite.id.toString(), {
        name: tramite.name,
        category: CATEGORY_LABELS[tramite.category],
      });
    }
    return map;
  }, [tramites]);

  const ranking = useMemo<RankingRow[]>(() => {
    if (!totals) return [];
    const total = totals.totalTramites;
    return totals.perTramite
      .filter(([, count]) => count > 0n)
      .map(([id, count]) => {
        const meta = tramiteNames.get(id.toString());
        return {
          id: id.toString(),
          name: meta?.name ?? `Trámite ${id.toString()}`,
          category: meta?.category ?? "Otra",
          count,
          share: total > 0n ? Number((count * 1000n) / total) / 10 : 0,
        };
      })
      .sort((a, b) => (b.count > a.count ? 1 : b.count < a.count ? -1 : 0))
      .slice(0, 8);
  }, [totals, tramiteNames]);

  const dailyData = useMemo<DailyPoint[]>(() => {
    const usuariosByDay = new Map<WeekDay, bigint>(
      totals?.perDayUsuarios ?? [],
    );
    const tramitesByDay = new Map<WeekDay, bigint>(
      totals?.perDayTramites ?? [],
    );
    return WEEK_DAYS.map((day) => ({
      day,
      label: WEEK_DAY_SHORT[day],
      usuarios: Number(usuariosByDay.get(day) ?? 0n),
      tramites: Number(tramitesByDay.get(day) ?? 0n),
    }));
  }, [totals]);

  const ageSlices = useMemo<AgeSlice[]>(() => {
    const byRange = new Map(totals?.perAgeRange ?? []);
    return AGE_RANGE_ORDER.map((range, index) => ({
      key: range,
      label: AGE_RANGE_LABELS[range],
      count: byRange.get(range) ?? 0n,
      color: AGE_COLORS[index % AGE_COLORS.length],
    }));
  }, [totals]);

  const openGaps = alerts?.length ?? 0;
  const loading = weeksLoading || totalsLoading;

  const handleOpenDay = (day: WeekDay) => {
    const index = WEEK_DAYS.indexOf(day);
    const dates = weekDates(weekStart);
    setActiveDay(dates[index] ?? dates[0]);
    void navigate({ to: "/formato-1" });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Panel de Control"
        title="Resumen de la semana"
        description="Totales, ranking de trámites, distribución demográfica y alertas de auditoría de la semana activa."
      />
      <WeekSelector weekStart={weekStart} onChange={setWeekStart} />

      <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:px-4 sm:py-6">
        {!weeksLoading && activeWeekId === null ? (
          <div
            data-ocid="panel.empty_state"
            className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center"
          >
            <p className="font-display text-base font-semibold text-foreground">
              No hay datos para esta semana
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Captura los formatos de esta semana para ver los indicadores del
              panel de control.
            </p>
          </div>
        ) : (
          <>
            <KpiCards
              totalUsuarios={totals?.totalUsuarios ?? 0n}
              totalTramites={totals?.totalTramites ?? 0n}
              openGaps={openGaps}
              loading={loading}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DailyComparisonChart data={dailyData} loading={loading} />
              <AgeDistributionChart
                slices={ageSlices}
                total={totals?.totalDemografico ?? 0n}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TramiteRanking
                rows={ranking}
                totalTramites={totals?.totalTramites ?? 0n}
                loading={loading}
              />
              <AuditAlerts
                alerts={alerts ?? []}
                loading={alertsLoading}
                onOpenDay={handleOpenDay}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
