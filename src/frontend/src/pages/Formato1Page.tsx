import type { WeekDay, WeekId } from "@/backend";
import { WeekSelector } from "@/components/WeekSelector";
import { Formato1Table } from "@/components/formato1/Formato1Table";
import {
  type Formato1Draft,
  draftFromRecord,
  draftIsValid,
  draftToWeekInput,
  draftsEqual,
  emptyDraft,
  enqueueSync,
  loadDraft,
  mergeDraft,
  readSyncQueue,
  removeSync,
  useFormato1Draft,
} from "@/components/formato1/useFormato1Draft";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  useCreateWeek,
  useIndicators,
  useTramites,
  useUpdateWeek,
  useWeek,
  useWeeks,
} from "@/hooks/useQueries";
import { useWeekStore } from "@/hooks/useWeekStore";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WEEK_DAY_LABELS, weekDayOf, weekRangeLabel } from "@/lib/week";
import { AlertTriangle, Check, CloudOff, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Estado de sincronización mostrado al usuario. */
type SyncState = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Formato 1 — Actividades Semanales.
 * Tabla de trámites y medidas por día con sumas automáticas y guardado en el
 * backend. Los totales siempre los calcula la aplicación.
 */
export default function Formato1Page() {
  const { weekStart, setWeekStart, activeDay, setActiveDay } = useWeekStore();
  const { data: tramites, isLoading: loadingTramites } = useTramites();
  const { data: indicators, isLoading: loadingIndicators } = useIndicators();
  const { data: weeks } = useWeeks();

  const tramiteList = useMemo(() => tramites ?? [], [tramites]);
  const indicatorList = useMemo(() => indicators ?? [], [indicators]);

  // Identifica la semana existente que corresponde al viernes activo.
  const existingId: WeekId | null = useMemo(() => {
    const match = (weeks ?? []).find((week) => week.startDate === weekStart);
    return match ? match.id : null;
  }, [weeks, weekStart]);

  const { data: record, isLoading: loadingRecord } = useWeek(existingId);
  const { draft, setTramiteCell, setIndicatorCell, reset, totals } =
    useFormato1Draft(weekStart);

  const createWeek = useCreateWeek();
  const updateWeek = useUpdateWeek();

  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const initializedFor = useRef<string | null>(null);

  // Inicializa el borrador una sola vez por semana: prefiere la captura local
  // (sin conexión) y, si no existe, el registro del backend o uno vacío.
  useEffect(() => {
    if (loadingTramites || loadingIndicators) return;
    if (initializedFor.current === weekStart) return;
    if (existingId !== null && loadingRecord) return;

    const base: Formato1Draft =
      existingId !== null && record
        ? draftFromRecord(record, tramiteList, indicatorList)
        : emptyDraft(tramiteList, indicatorList);

    const local = loadDraft(weekStart);
    const next = local ? mergeDraft(base, local) : base;

    reset(next);
    initializedFor.current = weekStart;
    setSyncState(
      local && !draftsEqual(next, base)
        ? "pending"
        : existingId !== null
          ? "saved"
          : "idle",
    );
    setSavedAt(
      existingId !== null && record ? formatTimestamp(record.updatedAt) : null,
    );
  }, [
    weekStart,
    existingId,
    record,
    loadingRecord,
    loadingTramites,
    loadingIndicators,
    tramiteList,
    indicatorList,
    reset,
  ]);

  const handleTramiteChange = (
    tramiteId: string,
    day: WeekDay,
    value: string,
  ) => {
    setTramiteCell(tramiteId, day, value);
    setSyncState("pending");
  };

  const handleIndicatorChange = (
    indicator: string,
    day: WeekDay,
    value: string,
  ) => {
    setIndicatorCell(indicator, day, value);
    setSyncState("pending");
  };

  const isValid = draftIsValid(draft);
  const isSaving = createWeek.isPending || updateWeek.isPending;
  const canSave = isValid && !isSaving;

  const handleSave = () => {
    if (!canSave) return;
    const input = draftToWeekInput(draft, weekStart);
    setSyncState("saving");

    const onError = () => {
      setSyncState("error");
      // Conserva la captura en la cola local para reintentar al volver la red.
      enqueueSync({
        weekStart,
        weekId: existingId !== null ? existingId.toString() : null,
        input,
        queuedAt: Date.now(),
      });
      toast.error(
        "Sin conexión. Los datos quedaron guardados en este dispositivo y se sincronizarán al recuperar la conexión.",
      );
    };

    const onSaved = (message: string) => {
      setSyncState("saved");
      removeSync(weekStart);
      setSavedAt(
        new Intl.DateTimeFormat("es", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
      toast.success(message);
    };

    if (existingId !== null) {
      updateWeek.mutate(
        { id: existingId, input },
        {
          onSuccess: () => onSaved("Semana actualizada."),
          onError,
        },
      );
    } else {
      createWeek.mutate(input, {
        onSuccess: () => onSaved("Semana guardada."),
        onError,
      });
    }
  };

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

  const activeDayLabel = activeDay
    ? WEEK_DAY_LABELS[weekDayOf(activeDay)]
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Formato 1"
        title="Actividades Semanales"
        description="Registro diario de trámites y medidas. Los totales se calculan automáticamente."
        actions={
          <Button
            type="button"
            data-ocid="formato1.save_button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {existingId !== null ? "Actualizar semana" : "Guardar semana"}
          </Button>
        }
      />

      <WeekSelector
        weekStart={weekStart}
        onChange={setWeekStart}
        activeDay={activeDay}
        onDayChange={setActiveDay}
      />

      <div className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:px-4">
        <SyncBanner
          state={syncState}
          savedAt={savedAt}
          weekLabel={weekRangeLabel(weekStart)}
          activeDayLabel={activeDayLabel}
        />

        {loadingTramites || loadingIndicators ? (
          <div
            data-ocid="formato1.loading_state"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Cargando catálogo de trámites…
          </div>
        ) : tramiteList.length === 0 ? (
          <div
            data-ocid="formato1.empty_state"
            className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground"
          >
            No hay trámites configurados en el catálogo institucional.
          </div>
        ) : (
          <Formato1Table
            tramites={tramiteList}
            indicators={indicatorList}
            draft={draft}
            totals={totals}
            activeDay={activeDay ? weekDayOf(activeDay) : undefined}
            onTramiteChange={handleTramiteChange}
            onIndicatorChange={handleIndicatorChange}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Desliza horizontalmente para ver todos los días. Cada celda acepta
          solo números enteros; los totales son calculados por el sistema y no
          se editan manualmente.
        </p>
      </div>
    </div>
  );
}

interface SyncBannerProps {
  state: SyncState;
  savedAt: string | null;
  weekLabel: string;
  activeDayLabel: string | null;
}

/** Banda de estado de sincronización con la semana activa. */
function SyncBanner({
  state,
  savedAt,
  weekLabel,
  activeDayLabel,
}: SyncBannerProps) {
  const config: Record<
    SyncState,
    { icon: typeof Check; text: string; className: string }
  > = {
    idle: {
      icon: CloudOff,
      text: "Sin cambios guardados para esta semana.",
      className: "border-border bg-muted/40 text-muted-foreground",
    },
    pending: {
      icon: AlertTriangle,
      text: "Cambios sin guardar. Pulsa «Guardar semana» para sincronizar.",
      className: "border-warning/40 bg-warning/10 text-warning",
    },
    saving: {
      icon: Loader2,
      text: "Guardando la semana…",
      className: "border-accent/40 bg-accent/10 text-accent",
    },
    saved: {
      icon: Check,
      text: savedAt
        ? `Semana guardada · última actualización ${savedAt}`
        : "Semana guardada.",
      className: "border-success/40 bg-success/10 text-success",
    },
    error: {
      icon: AlertTriangle,
      text: "No se pudo guardar. Revisa tu conexión e intenta nuevamente.",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    },
  };

  const { icon: Icon, text, className } = config[state];

  return (
    <output
      data-ocid="formato1.sync_state"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-4 shrink-0",
            state === "saving" && "animate-spin",
          )}
          aria-hidden="true"
        />
        {text}
      </span>
      <span className="text-muted-foreground">
        {weekLabel}
        {activeDayLabel ? ` · ${activeDayLabel}` : ""}
      </span>
    </output>
  );
}
