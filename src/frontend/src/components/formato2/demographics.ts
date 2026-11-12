import { AgeRange, Gender, type WeekDay } from "@/backend";
import { WEEK_DAYS } from "@/lib/week";

/** Orden canónico de los rangos etarios del Formato 2. */
export const AGE_RANGES: AgeRange[] = [
  AgeRange.nino0a5,
  AgeRange.nino6a11,
  AgeRange.nino12a13,
  AgeRange.adolescente14a17,
  AgeRange.adulto18mas,
];

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  [AgeRange.nino0a5]: "Niño 0-5",
  [AgeRange.nino6a11]: "Niño 6-11",
  [AgeRange.nino12a13]: "Niño 12-13",
  [AgeRange.adolescente14a17]: "Adolescente 14-17",
  [AgeRange.adulto18mas]: "Adulto 18+",
};

export const GENDERS: Gender[] = [Gender.femenino, Gender.masculino];

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.femenino]: "Femenino",
  [Gender.masculino]: "Masculino",
};

/** Clave estable de una celda del Formato 2: día + rango etario + género. */
export function cellKey(
  day: WeekDay,
  ageRange: AgeRange,
  gender: Gender,
): string {
  return `${day}|${ageRange}|${gender}`;
}

/**
 * Borrador de captura del Formato 2: valor de texto por celda (día, rango, género).
 * El texto vacío representa una celda sin capturar.
 */
export type DemographicDraft = Record<string, string>;

/** Borrador vacío con las 7 × 5 × 2 celdas del ciclo Viernes → Jueves. */
export function emptyDraft(): DemographicDraft {
  const draft: DemographicDraft = {};
  for (const day of WEEK_DAYS) {
    for (const ageRange of AGE_RANGES) {
      for (const gender of GENDERS) {
        draft[cellKey(day, ageRange, gender)] = "";
      }
    }
  }
  return draft;
}

/** Valor numérico de una celda del borrador; 0 si está vacía o es inválida. */
export function cellValue(draft: DemographicDraft, key: string): number {
  const raw = draft[key];
  if (raw === undefined || raw.trim() === "") return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

/** ¿La celda tiene un valor capturado válido (entero no negativo)? */
export function isCellValid(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === "") return false;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0;
}

/** Total de un día sumando todas las celdas de rango etario y género. */
export function dayTotal(draft: DemographicDraft, day: WeekDay): number {
  let total = 0;
  for (const ageRange of AGE_RANGES) {
    for (const gender of GENDERS) {
      total += cellValue(draft, cellKey(day, ageRange, gender));
    }
  }
  return total;
}

/** Subtotal de un rango etario en un día (ambos géneros). */
export function ageRangeSubtotal(
  draft: DemographicDraft,
  day: WeekDay,
  ageRange: AgeRange,
): number {
  return (
    cellValue(draft, cellKey(day, ageRange, Gender.femenino)) +
    cellValue(draft, cellKey(day, ageRange, Gender.masculino))
  );
}

/** Subtotal de un género en un día (todos los rangos etarios). */
export function genderSubtotal(
  draft: DemographicDraft,
  day: WeekDay,
  gender: Gender,
): number {
  let total = 0;
  for (const ageRange of AGE_RANGES) {
    total += cellValue(draft, cellKey(day, ageRange, gender));
  }
  return total;
}

/** Total semanal de un rango etario (todos los días). */
export function ageRangeWeekTotal(
  draft: DemographicDraft,
  ageRange: AgeRange,
): number {
  let total = 0;
  for (const day of WEEK_DAYS) {
    total += ageRangeSubtotal(draft, day, ageRange);
  }
  return total;
}

/** Total semanal de un género (todos los días). */
export function genderWeekTotal(
  draft: DemographicDraft,
  gender: Gender,
): number {
  let total = 0;
  for (const day of WEEK_DAYS) {
    total += genderSubtotal(draft, day, gender);
  }
  return total;
}

/** Total semanal de usuarios atendidos (todas las celdas). */
export function weekTotal(draft: DemographicDraft): number {
  let total = 0;
  for (const day of WEEK_DAYS) {
    total += dayTotal(draft, day);
  }
  return total;
}

/** ¿Todas las celdas del borrador tienen un valor válido? */
export function isDraftComplete(draft: DemographicDraft): boolean {
  return Object.values(draft).every((raw) => isCellValid(raw));
}
