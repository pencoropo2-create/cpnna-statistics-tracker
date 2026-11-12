import { WeekDay } from "@/backend";

/**
 * Ciclo estadístico Viernes → Jueves.
 * El día de inicio de la semana es el viernes; el cierre es el jueves.
 */
export const WEEK_DAYS: WeekDay[] = [
  WeekDay.viernes,
  WeekDay.sabado,
  WeekDay.domingo,
  WeekDay.lunes,
  WeekDay.martes,
  WeekDay.miercoles,
  WeekDay.jueves,
];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  [WeekDay.viernes]: "Viernes",
  [WeekDay.sabado]: "Sábado",
  [WeekDay.domingo]: "Domingo",
  [WeekDay.lunes]: "Lunes",
  [WeekDay.martes]: "Martes",
  [WeekDay.miercoles]: "Miércoles",
  [WeekDay.jueves]: "Jueves",
};

export const WEEK_DAY_SHORT: Record<WeekDay, string> = {
  [WeekDay.viernes]: "Vie",
  [WeekDay.sabado]: "Sáb",
  [WeekDay.domingo]: "Dom",
  [WeekDay.lunes]: "Lun",
  [WeekDay.martes]: "Mar",
  [WeekDay.miercoles]: "Mié",
  [WeekDay.jueves]: "Jue",
};

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha ISO (YYYY-MM-DD) del viernes que inicia la semana que contiene `date`. */
export function weekStartOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay(): 0=domingo … 5=viernes, 6=sábado. Retrocedemos hasta el viernes.
  const offset = (d.getDay() + 2) % 7;
  d.setDate(d.getDate() - offset);
  return toIsoDate(d);
}

/** Fecha ISO de hoy. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Suma (o resta) semanas a una fecha ISO de inicio de semana. */
export function addWeeks(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta * 7);
  return toIsoDate(d);
}

/** Las siete fechas ISO del ciclo Viernes → Jueves que inicia en `startIso`. */
export function weekDates(startIso: string): string[] {
  const start = parseIsoDate(startIso);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toIsoDate(d);
  });
}

/** Etiqueta legible: "Viernes 12 – Jueves 18 de septiembre". */
export function weekRangeLabel(startIso: string): string {
  const dates = weekDates(startIso);
  const start = parseIsoDate(dates[0]);
  const end = parseIsoDate(dates[6]);
  const startMonth = MONTHS_ES[start.getMonth()];
  const endMonth = MONTHS_ES[end.getMonth()];
  const sameMonth = start.getMonth() === end.getMonth();
  const range = sameMonth
    ? `${start.getDate()} – ${end.getDate()} de ${endMonth}`
    : `${start.getDate()} de ${startMonth} – ${end.getDate()} de ${endMonth}`;
  return `Viernes ${range}`;
}

/** Etiqueta corta: "12 – 18 sep". */
export function weekShortLabel(startIso: string): string {
  const dates = weekDates(startIso);
  const start = parseIsoDate(dates[0]);
  const end = parseIsoDate(dates[6]);
  const endMonth = MONTHS_ES[end.getMonth()].slice(0, 3);
  return `${start.getDate()} – ${end.getDate()} ${endMonth}`;
}

/** ¿La semana `startIso` es la semana en curso? */
export function isCurrentWeek(startIso: string): boolean {
  return startIso === weekStartOf(new Date());
}

/** Día del ciclo (WeekDay) para una fecha ISO dentro de la semana. */
export function weekDayOf(iso: string): WeekDay {
  const idx = weekDates(weekStartOf(parseIsoDate(iso))).indexOf(iso);
  return WEEK_DAYS[idx >= 0 ? idx : 0];
}
