import type { Timestamp } from "@/backend";

/** Convierte un timestamp nanosegundo del backend a Date, o null si es inválido. */
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formatea un timestamp del backend como fecha y hora local en español. */
export function formatTimestamp(timestamp: Timestamp): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Formatea un bigint como entero con separador de miles. */
export function formatCount(value: bigint): string {
  return new Intl.NumberFormat("es").format(value);
}

/** Formatea un número decimal con un decimal fijo. */
export function formatDecimal(value: number, digits = 1): string {
  return new Intl.NumberFormat("es", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Convierte texto de entrada numérica a bigint, tolerando vacío y separadores. */
export function parseCountInput(raw: string): bigint {
  const cleaned = raw.replace(/[^\d-]/g, "");
  if (cleaned === "" || cleaned === "-") return 0n;
  try {
    return BigInt(cleaned);
  } catch {
    return 0n;
  }
}
