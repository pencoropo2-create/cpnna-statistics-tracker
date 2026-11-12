import type { DemographicCount, WeekDay, WeekInput } from "@/backend";
import { WeekSelector } from "@/components/WeekSelector";
import {
  enqueueSync,
  loadLocal,
  readSyncQueue,
  removeSync,
  saveLocal,
} from "@/components/formato1/useFormato1Draft";
import { DemographicGrid } from "@/components/formato2/DemographicGrid";
import {
  type DayDiscrepancy,
  DiscrepancyAlert,
} from "@/components/formato2/DiscrepancyAlert";
import {
  AGE_RANGES,
  AGE_RANGE_LABELS,
  type DemographicDraft,
  GENDERS,
  GENDER_LABELS,
  ageRangeWeekTotal,
  cellKey,
  cellValue,
  dayTotal,
  emptyDraft,
  genderWeekTotal,
  isDraftComplete,
  weekTotal,
} from "@/components/formato2/demographics";
import { useWeekTotals } from "@/components/formato2/useWeekTotals";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateWeek,
  useUpdateWeek,
  useWeek,
  useWeeks,
} from "@/hooks/useQueries";
import { useWeekStore } from "@/hooks/useWeekStore";
import { WEEK_DAYS } from "@/lib/week";
import { CheckCircle2, CloudOff, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Construye el borrador de captura a partir de los datos demográficos guardados. */
function draftFromDemographics(
  demographics: DemographicCount[],
): DemographicDraft {
  const draft = emptyDraft();
  for (const entry of demographics) {
    draft[cellKey(entry.day, entry.ageRange, entry.gender)] =
      entry.count.toString();
  }
  return draft;
}

/** Convierte el borrador en la lista de conteos demográficos del backend. */
function demographicsFromDraft(draft: DemographicDraft): DemographicCount[] {
  const result: DemographicCount[] = [];
  for (const day of WEEK_DAYS) {
    for (const ageRange of AGE_RANGES) {
      for (const gender of GENDERS) {
        const count = cellValue(draft, cellKey(day, ageRange, gender));
        if (count > 0) {
          result.push({ day, ageRange, gender, count: BigInt(count) });
        }
      }
    }
  }
  return result;
}

/** Serializa el borrador para comparar cambios sin depender del orden de claves. */
function serializeDraft(draft: DemographicDraft): string {
  return Object.keys(draft)
    .sort()
    .map((key) => `${key}=${draft[key] ?? ""}`)
    .join("&");
}

/**
 * Formato 2 — Población Atendida por Edad y Género.
 * Desglose diario de usuarios atendidos por rango etario y género, con
 * subtotales automáticos y validación cruzada contra el Formato 1.
 */
export default function Formato2Page() {
  const { weekStart, setWeekStart, activeDay, setActiveDay } = useWeekStore();
  const { data: weeks } = useWeeks();

  const existingWeek = useMemo(
    () => weeks?.find((week) => week.startDate === weekStart) ?? null,
    [weeks, weekStart],
  );
  const weekId = existingWeek?.id ?? null;

  const { data: week, isLoading: isLoadingWeek } = useWeek(weekId);
  const { data: totals } = useWeekTotals(weekId);
  const createWeek = useCreateWeek();
  const updateWeek = useUpdateWeek();

  const [draft, setDraft] = useState<DemographicDraft>(emptyDraft);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const initializedFor = useRef<string | null>(null);

  const draftKey = `cpnna:formato2:draft:${weekStart}`;

  // Inicializa el borrador una sola vez por semana cargada (nunca desde refetch).
  // Prefiere la captura local para no perder datos capturados sin conexión.
  useEffect(() => {
    if (isLoadingWeek) return;
    const marker = weekId?.toString() ?? `new:${weekStart}`;
    if (initializedFor.current === marker) return;
    if (weekId !== null && !week) return;
    const base = week ? draftFromDemographics(week.demographics) : emptyDraft();
    const local = loadLocal<DemographicDraft>(draftKey);
    const next = local ? { ...base, ...local } : base;
    setDraft(next);
    setSavedSnapshot(serializeDraft(base));
    initializedFor.current = marker;
  }, [isLoadingWeek, weekId, week, weekStart, draftKey]);

  // Persiste cada cambio para no perder la captura al recargar sin conexión.
  useEffect(() => {
    saveLocal(draftKey, draft);
  }, [draftKey, draft]);

  const currentSnapshot = serializeDraft(draft);
  const isDirty = currentSnapshot !== savedSnapshot;
  const isSaving = createWeek.isPending || updateWeek.isPending;

  // Totales del Formato 1 por día (trámites = usuarios atendidos reportados).
  const format1ByDay = useMemo(() => {
    const map = new Map<WeekDay, number>();
    if (totals) {
      for (const [day, value] of totals.perDayTramites) {
        map.set(day, Number(value));
      }
    }
    return map;
  }, [totals]);

  const discrepancies = useMemo<DayDiscrepancy[]>(() => {
    if (!totals) return [];
    const list: DayDiscrepancy[] = [];
    for (const day of WEEK_DAYS) {
      const format1Total = format1ByDay.get(day);
      if (format1Total === undefined) continue;
      const format2Total = dayTotal(draft, day);
      if (format2Total !== format1Total) {
        list.push({ day, format1Total, format2Total });
      }
    }
    return list;
  }, [draft, totals, format1ByDay]);

  const complete = isDraftComplete(draft);
  const total = weekTotal(draft);

  function handleCellChange(key: string, value: string) {
    const cleaned = value.replace(/[^\d]/g, "");
    setDraft((current) => ({ ...current, [key]: cleaned }));
  }

  function handleSave() {
    if (!complete) {
      toast.error("Completa todos los campos numéricos antes de guardar.");
      return;
    }
    const input: WeekInput = {
      startDate: weekStart,
      demographics: demographicsFromDraft(draft),
      tramiteCounts: week?.tramiteCounts ?? [],
      indicatorCounts: week?.indicatorCounts ?? [],
    };
    const snapshot = currentSnapshot;
    const onSuccess = () => {
      setSavedSnapshot(snapshot);
      removeSync(weekStart);
      toast.success("Formato 2 guardado correctamente.");
    };
    const onError = () => {
      enqueueSync({
        weekStart,
        weekId: weekId !== null ? weekId.toString() : null,
        input,
        queuedAt: Date.now(),
      });
      toast.error(
        "Sin conexión. Los datos quedaron guardados en este dispositivo y se sincronizarán al recuperar la conexión.",
      );
    };
    if (weekId !== null) {
      updateWeek.mutate({ id: weekId, input }, { onSuccess, onError });
    } else {
      createWeek.mutate(input, { onSuccess, onError });
    }
  }

  // Reintenta las semanas pendientes cuando vuelve la conexión.
  const flushRef = useRef<() => void>(() => {});
  flushRef.current = () => {
    for (const entry of readSyncQueue()) {
      const onSuccess = () => {
        removeSync(entry.weekStart);
        toast.success("Datos sincronizados con el servidor.");
      };
      if (entry.weekId !== null) {
        updateWeek.mutate(
          { id: BigInt(entry.weekId), input: entry.input },
          { onSuccess },
        );
      } else {
        createWeek.mutate(entry.input, { onSuccess });
      }
    }
  };

  useEffect(() => {
    const onOnline = () => flushRef.current();
    window.addEventListener("online", onOnline);
    if (typeof navigator === "undefined" || navigator.onLine) {
      flushRef.current();
    }
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Formato 2"
        title="Población Atendida por Edad y Género"
        description="Desglose diario de usuarios atendidos por rango etario y género, con validación cruzada contra el Formato 1."
      />
      <WeekSelector
        weekStart={weekStart}
        onChange={setWeekStart}
        activeDay={activeDay}
        onDayChange={setActiveDay}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {isLoadingWeek ? (
          <div data-ocid="formato2.loading_state" className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <DiscrepancyAlert discrepancies={discrepancies} />

            {WEEK_DAYS.map((day) => (
              <DemographicGrid
                key={day}
                day={day}
                draft={draft}
                onCellChange={handleCellChange}
                format1Total={format1ByDay.get(day) ?? null}
              />
            ))}

            <section
              data-ocid="formato2.summary"
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                <h2 className="font-display text-base font-semibold text-foreground">
                  Resumen semanal
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                <div className="bg-card px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    Por rango etario
                  </p>
                  <ul className="mt-2 space-y-1">
                    {AGE_RANGES.map((ageRange) => (
                      <li
                        key={ageRange}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {AGE_RANGE_LABELS[ageRange]}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {ageRangeWeekTotal(draft, ageRange)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    Por género
                  </p>
                  <ul className="mt-2 space-y-1">
                    {GENDERS.map((gender) => (
                      <li
                        key={gender}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {GENDER_LABELS[gender]}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          {genderWeekTotal(draft, gender)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm font-semibold text-foreground">
                      Total semanal
                    </span>
                    <span className="font-mono text-lg font-bold tabular-nums text-primary">
                      {total}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  {isDirty ? (
                    <span
                      data-ocid="formato2.pending_state"
                      className="flex items-center gap-1.5 text-warning"
                    >
                      <CloudOff className="size-4" aria-hidden="true" />
                      Cambios sin guardar
                    </span>
                  ) : (
                    <span
                      data-ocid="formato2.saved_state"
                      className="flex items-center gap-1.5 text-success"
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Todo guardado
                    </span>
                  )}
                  {!complete && (
                    <span className="text-xs text-muted-foreground">
                      · Faltan campos por completar
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  data-ocid="formato2.save_button"
                  onClick={handleSave}
                  disabled={isSaving || !complete}
                  className="h-11 rounded-lg bg-primary px-5 text-primary-foreground transition-smooth hover:brightness-110"
                >
                  {isSaving ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {isSaving ? "Guardando…" : "Guardar semana"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
