import { AgeRange } from "@/backend";

/** Etiqueta legible en español para cada grupo etario. */
export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  [AgeRange.nino0a5]: "Niños 0 a 5",
  [AgeRange.nino6a11]: "Niños 6 a 11",
  [AgeRange.nino12a13]: "Niños 12 a 13",
  [AgeRange.adolescente14a17]: "Adolescentes 14 a 17",
  [AgeRange.adulto18mas]: "Adultos 18+",
};

/** Orden de presentación de menor a mayor edad. */
export const AGE_RANGE_ORDER: AgeRange[] = [
  AgeRange.nino0a5,
  AgeRange.nino6a11,
  AgeRange.nino12a13,
  AgeRange.adolescente14a17,
  AgeRange.adulto18mas,
];

/** Etiqueta corta para ejes y leyendas. */
export const AGE_RANGE_SHORT: Record<AgeRange, string> = {
  [AgeRange.nino0a5]: "0–5",
  [AgeRange.nino6a11]: "6–11",
  [AgeRange.nino12a13]: "12–13",
  [AgeRange.adolescente14a17]: "14–17",
  [AgeRange.adulto18mas]: "18+",
};
