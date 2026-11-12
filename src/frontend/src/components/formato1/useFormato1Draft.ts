import type {
  IndicatorCount,
  ManagementIndicator,
  Tramite,
  TramiteCount,
  WeekDay,
  WeekInput,
  WeekRecord,
} from "@/backend";
import { WEEK_DAYS } from "@/lib/week";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Borrador de una celda: texto tal como lo escribe el usuario. */
type CellDraft = Record<WeekDay, string>;

/** Borrador completo del Formato 1 (estado de UI local, no del backend). */
export interface Formato1Draft {
  /** Texto por trámite y día. */
  tramites: Record<string, CellDraft>;
  /** Texto por indicador de gestión y día. */
  indicators: Record<string, CellDraft>;
}

/** Resultado de validar una celda numérica. */
export interface CellValidation {
  valid: boolean;
  error?: string;
}

const EMPTY_CELL: CellDraft = {
  viernes: "0",
  sabado: "0",
  domingo: "0",
  lunes: "0",
  martes: "0",
  miercoles: "0",
  jueves: "0",
};

function emptyCell(): CellDraft {
  return { ...EMPTY_CELL };
}

/** Valida el texto de una celda: obligatorio, numérico y no negativo. */
export function validateCell(raw: string): CellValidation {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { valid: false, error: "Requerido" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: "Solo números" };
  }
  return { valid: true };
}

/** Convierte el texto validado de una celda a bigint. */
function cellToBigint(raw: string): bigint {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 0n;
  return BigInt(trimmed);
}

/** Construye un borrador vacío a partir del catálogo de trámites e indicadores. */
export function emptyDraft(
  tramites: Tramite[],
  indicators: ManagementIndicator[],
): Formato1Draft {
  const tramiteDraft: Record<string, CellDraft> = {};
  for (const tramite of tramites) {
    tramiteDraft[tramite.id.toString()] = emptyCell();
  }
  const indicatorDraft: Record<string, CellDraft> = {};
  for (const indicator of indicators) {
    indicatorDraft[indicator] = emptyCell();
  }
  return { tramites: tramiteDraft, indicators: indicatorDraft };
}

/** Construye un borrador a partir de una semana existente del backend. */
export function draftFromRecord(
  record: WeekRecord,
  tramites: Tramite[],
  indicators: ManagementIndicator[],
): Formato1Draft {
  const draft = emptyDraft(tramites, indicators);
  for (const entry of record.tramiteCounts) {
    const key = entry.tramiteId.toString();
    if (draft.tramites[key]) {
      draft.tramites[key][entry.day] = entry.count.toString();
    }
  }
  for (const entry of record.indicatorCounts) {
    if (draft.indicators[entry.indicator]) {
      draft.indicators[entry.indicator][entry.day] = entry.count.toString();
    }
  }
  return draft;
}

/** Totales calculados en vivo a partir del borrador. */
export interface DraftTotals {
  /** Total por trámite (suma horizontal). */
  perTramite: Record<string, bigint>;
  /** Total de trámites por día (suma vertical). */
  perDayTramites: Record<WeekDay, bigint>;
  /** Total de usuarios atendidos por día (suma vertical). */
  perDayUsuarios: Record<WeekDay, bigint>;
  /** Total general de trámites. */
  totalTramites: bigint;
  /** Total general de usuarios atendidos. */
  totalUsuarios: bigint;
  /** Total por indicador de gestión. */
  perIndicator: Record<string, bigint>;
}

function zeroByDay(): Record<WeekDay, bigint> {
  const result = {} as Record<WeekDay, bigint>;
  for (const day of WEEK_DAYS) result[day] = 0n;
  return result;
}

/** Calcula los totales horizontales y verticales del borrador. */
export function computeDraftTotals(draft: Formato1Draft): DraftTotals {
  const perTramite: Record<string, bigint> = {};
  const perDayTramites = zeroByDay();
  let totalTramites = 0n;

  for (const [tramiteId, cells] of Object.entries(draft.tramites)) {
    let rowTotal = 0n;
    for (const day of WEEK_DAYS) {
      const value = cellToBigint(cells[day]);
      rowTotal += value;
      perDayTramites[day] += value;
    }
    perTramite[tramiteId] = rowTotal;
    totalTramites += rowTotal;
  }

  const perIndicator: Record<string, bigint> = {};
  for (const [indicator, cells] of Object.entries(draft.indicators)) {
    let rowTotal = 0n;
    for (const day of WEEK_DAYS) {
      rowTotal += cellToBigint(cells[day]);
    }
    perIndicator[indicator] = rowTotal;
  }

  // En el Formato 1 cada trámite atendido corresponde a un usuario atendido.
  const perDayUsuarios = { ...perDayTramites };

  return {
    perTramite,
    perDayTramites,
    perDayUsuarios,
    totalTramites,
    totalUsuarios: totalTramites,
    perIndicator,
  };
}

/** Convierte el borrador en la entrada que espera el backend. */
export function draftToWeekInput(
  draft: Formato1Draft,
  startDate: string,
): WeekInput {
  const tramiteCounts: TramiteCount[] = [];
  for (const [tramiteId, cells] of Object.entries(draft.tramites)) {
    for (const day of WEEK_DAYS) {
      const count = cellToBigint(cells[day]);
      if (count > 0n) {
        tramiteCounts.push({ tramiteId: BigInt(tramiteId), day, count });
      }
    }
  }

  const indicatorCounts: IndicatorCount[] = [];
  for (const [indicator, cells] of Object.entries(draft.indicators)) {
    for (const day of WEEK_DAYS) {
      const count = cellToBigint(cells[day]);
      if (count > 0n) {
        indicatorCounts.push({
          indicator: indicator as ManagementIndicator,
          day,
          count,
        });
      }
    }
  }

  return {
    startDate,
    tramiteCounts,
    indicatorCounts,
    demographics: [],
  };
}

/** ¿Todas las celdas del borrador son válidas? */
export function draftIsValid(draft: Formato1Draft): boolean {
  const all = [
    ...Object.values(draft.tramites),
    ...Object.values(draft.indicators),
  ];
  return all.every((cells) =>
    WEEK_DAYS.every((day) => validateCell(cells[day]).valid),
  );
}

/* ------------------------------------------------------------------ *
 * Persistencia local y cola de sincronización (captura sin conexión)  *
 * ------------------------------------------------------------------ */

const DRAFT_PREFIX = "cpnna:formato1:draft:";
const SYNC_QUEUE_KEY = "cpnna:sync-queue";

/** Serializa valores con bigint a JSON (los bigint se guardan como "123n"). */
function serializeJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    typeof val === "bigint" ? `${val.toString()}n` : val,
  );
}

/** Reconstruye valores con bigint desde JSON. */
function deserializeJson<T>(raw: string): T {
  return JSON.parse(raw, (_key, val) =>
    typeof val === "string" && /^-?\d+n$/.test(val)
      ? BigInt(val.slice(0, -1))
      : val,
  ) as T;
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Lee un valor JSON del almacenamiento local; null si no existe o es inválido. */
export function loadLocal<T>(key: string): T | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(key);
  if (raw === null) return null;
  try {
    return deserializeJson<T>(raw);
  } catch {
    return null;
  }
}

/** Guarda un valor JSON en el almacenamiento local. */
export function saveLocal<T>(key: string, value: T): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, serializeJson(value));
  } catch {
    // Almacenamiento lleno o no disponible: la captura sigue en memoria.
  }
}

/** Elimina una clave del almacenamiento local. */
export function removeLocal(key: string): void {
  storage()?.removeItem(key);
}

/** Borrador local del Formato 1 para una semana. */
export function loadDraft(weekStart: string): Formato1Draft | null {
  return loadLocal<Formato1Draft>(`${DRAFT_PREFIX}${weekStart}`);
}

/** Persiste el borrador local del Formato 1 para una semana. */
export function saveDraft(weekStart: string, draft: Formato1Draft): void {
  saveLocal(`${DRAFT_PREFIX}${weekStart}`, draft);
}

/** Descarta el borrador local del Formato 1 de una semana. */
export function clearDraft(weekStart: string): void {
  removeLocal(`${DRAFT_PREFIX}${weekStart}`);
}

/** Superpone los valores locales sobre el esqueleto del catálogo. */
export function mergeDraft(
  base: Formato1Draft,
  local: Formato1Draft,
): Formato1Draft {
  const merged: Formato1Draft = {
    tramites: { ...base.tramites },
    indicators: { ...base.indicators },
  };
  for (const [id, cells] of Object.entries(local.tramites)) {
    if (merged.tramites[id]) {
      merged.tramites[id] = { ...merged.tramites[id], ...cells };
    }
  }
  for (const [indicator, cells] of Object.entries(local.indicators)) {
    if (merged.indicators[indicator]) {
      merged.indicators[indicator] = {
        ...merged.indicators[indicator],
        ...cells,
      };
    }
  }
  return merged;
}

/** ¿Dos borradores tienen los mismos valores? */
export function draftsEqual(a: Formato1Draft, b: Formato1Draft): boolean {
  return serializeJson(a) === serializeJson(b);
}

/** Entrada pendiente de sincronizar con el backend. */
export interface PendingWeekSync {
  weekStart: string;
  /** Id de la semana existente, o null si debe crearse. */
  weekId: string | null;
  input: WeekInput;
  queuedAt: number;
}

/** Cola de semanas pendientes de sincronizar. */
export function readSyncQueue(): PendingWeekSync[] {
  return loadLocal<PendingWeekSync[]>(SYNC_QUEUE_KEY) ?? [];
}

/** Añade (o reemplaza) una semana en la cola de sincronización. */
export function enqueueSync(entry: PendingWeekSync): void {
  const queue = readSyncQueue().filter(
    (item) => item.weekStart !== entry.weekStart,
  );
  queue.push(entry);
  saveLocal(SYNC_QUEUE_KEY, queue);
}

/** Quita una semana de la cola de sincronización. */
export function removeSync(weekStart: string): void {
  const queue = readSyncQueue().filter((item) => item.weekStart !== weekStart);
  saveLocal(SYNC_QUEUE_KEY, queue);
}

/**
 * Estado del borrador del Formato 1 con edición, validación y totales en vivo.
 * Persiste el borrador en el almacenamiento local para sobrevivir a recargas
 * sin conexión; la sincronización con el backend la realiza la página.
 */
export function useFormato1Draft(weekStart: string) {
  const [draft, setDraft] = useState<Formato1Draft>(
    () => loadDraft(weekStart) ?? { tramites: {}, indicators: {} },
  );

  // Persiste cada cambio para no perder la captura al recargar sin conexión.
  useEffect(() => {
    saveDraft(weekStart, draft);
  }, [weekStart, draft]);

  const setTramiteCell = useCallback(
    (tramiteId: string, day: WeekDay, value: string) => {
      setDraft((current) => ({
        ...current,
        tramites: {
          ...current.tramites,
          [tramiteId]: { ...current.tramites[tramiteId], [day]: value },
        },
      }));
    },
    [],
  );

  const setIndicatorCell = useCallback(
    (indicator: string, day: WeekDay, value: string) => {
      setDraft((current) => ({
        ...current,
        indicators: {
          ...current.indicators,
          [indicator]: { ...current.indicators[indicator], [day]: value },
        },
      }));
    },
    [],
  );

  const reset = useCallback((next: Formato1Draft) => {
    setDraft(next);
  }, []);

  const totals = useMemo(() => computeDraftTotals(draft), [draft]);

  return { draft, setTramiteCell, setIndicatorCell, reset, totals };
}
