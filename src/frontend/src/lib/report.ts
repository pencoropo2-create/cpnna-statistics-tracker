import type {
  AgeRange,
  AuditAlert,
  Gender,
  ManagementIndicator,
  Tramite,
  TramiteCategory,
  WeekRecord,
  WeekTotals,
} from "@/backend";
import {
  AgeRange as AgeRangeEnum,
  Gender as GenderEnum,
  ManagementIndicator as ManagementIndicatorEnum,
} from "@/backend";
import {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  weekDates,
  weekRangeLabel,
} from "@/lib/week";
import {
  XLSX_STYLES,
  type XlsxCell,
  type XlsxRow,
  type XlsxSheet,
} from "@/lib/xlsx";

/* --------------------------------- Etiquetas ------------------------------- */

export const AGE_RANGE_LABELS: Record<AgeRange, string> = {
  [AgeRangeEnum.nino0a5]: "Niño (0-5 años)",
  [AgeRangeEnum.nino6a11]: "Niño (6-11 años)",
  [AgeRangeEnum.nino12a13]: "Niño (12-13 años)",
  [AgeRangeEnum.adolescente14a17]: "Adolescente (14-17 años)",
  [AgeRangeEnum.adulto18mas]: "Adulto (18+ años)",
};

export const AGE_RANGE_ORDER: AgeRange[] = [
  AgeRangeEnum.nino0a5,
  AgeRangeEnum.nino6a11,
  AgeRangeEnum.nino12a13,
  AgeRangeEnum.adolescente14a17,
  AgeRangeEnum.adulto18mas,
];

export const GENDER_LABELS: Record<Gender, string> = {
  [GenderEnum.femenino]: "Femenino",
  [GenderEnum.masculino]: "Masculino",
};

export const GENDER_ORDER: Gender[] = [
  GenderEnum.femenino,
  GenderEnum.masculino,
];

export const CATEGORY_LABELS: Record<TramiteCategory, string> = {
  aperturaCausa: "Aperturas de causas",
  medidaCuidado: "Medidas de cuidado",
  medidaResponsabilidad: "Medidas de responsabilidad",
  remision: "Remisiones",
  autorizacionViajeNacional: "Autorizaciones de viaje nacional",
  autorizacionViajeInternacional: "Autorizaciones de viaje internacional",
  constatacion: "Constataciones",
  psicologia: "Psicología",
  otra: "Otras actuaciones",
};

export const INDICATOR_LABELS: Record<ManagementIndicator, string> = {
  seguimientoCausa: "Seguimiento de causa",
  expedientesAperturados: "Expedientes aperturados",
  entrevistas: "Entrevistas",
};

export const INDICATOR_ORDER: ManagementIndicator[] = [
  ManagementIndicatorEnum.seguimientoCausa,
  ManagementIndicatorEnum.expedientesAperturados,
  ManagementIndicatorEnum.entrevistas,
];

/* ------------------------------ Modelo de reporte -------------------------- */

export interface ReportTramiteRow {
  tramite: Tramite;
  /** Conteo por día, en el orden Viernes → Jueves. */
  perDay: bigint[];
  total: bigint;
}

export interface ReportDemographicRow {
  ageRange: AgeRange;
  /** Conteo por género. */
  perGender: Record<Gender, bigint>;
  total: bigint;
}

export interface ReportKpi {
  label: string;
  value: string;
  hint?: string;
}

export interface WeeklyReport {
  weekStart: string;
  rangeLabel: string;
  tramiteRows: ReportTramiteRow[];
  tramiteTotalsPerDay: bigint[];
  tramiteGrandTotal: bigint;
  demographicRows: ReportDemographicRow[];
  demographicTotalsPerDay: bigint[];
  demographicGrandTotal: bigint;
  indicatorRows: {
    indicator: ManagementIndicator;
    perDay: bigint[];
    total: bigint;
  }[];
  alerts: AuditAlert[];
  totals: WeekTotals | null;
  kpis: ReportKpi[];
}

function countFor(
  entries: { day: string; count: bigint }[],
  day: string,
): bigint {
  let total = 0n;
  for (const entry of entries) {
    if (entry.day === day) total += entry.count;
  }
  return total;
}

/** Construye el modelo consolidado del reporte semanal a partir de los datos del backend. */
export function buildWeeklyReport(
  week: WeekRecord,
  tramites: Tramite[],
  totals: WeekTotals | null,
  alerts: AuditAlert[],
): WeeklyReport {
  const days = WEEK_DAYS;

  const tramiteRows: ReportTramiteRow[] = [...tramites]
    .sort((a, b) => Number(a.order - b.order))
    .map((tramite) => {
      const perDay = days.map((day) =>
        countFor(
          week.tramiteCounts.filter((c) => c.tramiteId === tramite.id),
          day,
        ),
      );
      const total = perDay.reduce((sum, value) => sum + value, 0n);
      return { tramite, perDay, total };
    });

  const tramiteTotalsPerDay = days.map((_, index) =>
    tramiteRows.reduce((sum, row) => sum + row.perDay[index], 0n),
  );
  const tramiteGrandTotal = tramiteTotalsPerDay.reduce(
    (sum, value) => sum + value,
    0n,
  );

  const demographicRows: ReportDemographicRow[] = AGE_RANGE_ORDER.map(
    (ageRange) => {
      const perGender = {
        [GenderEnum.femenino]: 0n,
        [GenderEnum.masculino]: 0n,
      } as Record<Gender, bigint>;
      for (const entry of week.demographics) {
        if (entry.ageRange === ageRange) {
          perGender[entry.gender] += entry.count;
        }
      }
      const total =
        perGender[GenderEnum.femenino] + perGender[GenderEnum.masculino];
      return { ageRange, perGender, total };
    },
  );

  const demographicTotalsPerDay = days.map((day) =>
    countFor(week.demographics, day),
  );
  const demographicGrandTotal = demographicTotalsPerDay.reduce(
    (sum, value) => sum + value,
    0n,
  );

  const indicatorRows = INDICATOR_ORDER.map((indicator) => {
    const perDay = days.map((day) =>
      countFor(
        week.indicatorCounts.filter((c) => c.indicator === indicator),
        day,
      ),
    );
    const total = perDay.reduce((sum, value) => sum + value, 0n);
    return { indicator, perDay, total };
  });

  const kpis: ReportKpi[] = [
    {
      label: "Total de trámites y medidas",
      value: Number(tramiteGrandTotal).toLocaleString("es"),
      hint: "Formato 1",
    },
    {
      label: "Población atendida",
      value: Number(demographicGrandTotal).toLocaleString("es"),
      hint: "Formato 2",
    },
    {
      label: "Días con discrepancia",
      value: String(alerts.length),
      hint: alerts.length === 0 ? "Sin alertas" : "Revisar auditoría",
    },
    {
      label: "Promedio diario de trámites",
      value: (Number(tramiteGrandTotal) / 7).toLocaleString("es", {
        maximumFractionDigits: 1,
      }),
      hint: "Sobre 7 días del ciclo",
    },
  ];

  return {
    weekStart: week.startDate,
    rangeLabel: weekRangeLabel(week.startDate),
    tramiteRows,
    tramiteTotalsPerDay,
    tramiteGrandTotal,
    demographicRows,
    demographicTotalsPerDay,
    demographicGrandTotal,
    indicatorRows,
    alerts,
    totals,
    kpis,
  };
}

/* ------------------------------ Hojas de Excel ----------------------------- */

function text(value: string, style?: number): XlsxCell {
  return { value: { kind: "text", value }, style };
}

function num(value: bigint | number, style?: number): XlsxCell {
  return { value: { kind: "number", value: Number(value) }, style };
}

function formula(f: string, cached: number, style?: number): XlsxCell {
  return { value: { kind: "formula", formula: f, cached }, style };
}

function columnLetter(index: number): string {
  let n = index;
  let name = "";
  while (n >= 0) {
    name = String.fromCharCode((n % 26) + 65) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

function buildFormato1Sheet(report: WeeklyReport): XlsxSheet {
  const dayHeaders = WEEK_DAYS.map((day) => WEEK_DAY_LABELS[day]);
  const header: XlsxRow = [
    text("Código", XLSX_STYLES.header),
    text("Trámite o medida", XLSX_STYLES.header),
    ...dayHeaders.map((label) => text(label, XLSX_STYLES.header)),
    text("Total", XLSX_STYLES.header),
  ];

  const rows: XlsxRow[] = [
    [text("CPNNA · Formato 1 — Actividades Semanales", XLSX_STYLES.title)],
    [text(`Semana: ${report.rangeLabel}`, XLSX_STYLES.subtitle)],
    [],
    header,
  ];

  const firstDataRow = rows.length + 1;
  for (const row of report.tramiteRows) {
    rows.push([
      text(row.tramite.code, XLSX_STYLES.label),
      text(row.tramite.name, XLSX_STYLES.label),
      ...row.perDay.map((value) => num(value, XLSX_STYLES.number)),
      formula(
        `SUM(${columnLetter(2)}${rows.length + 1}:${columnLetter(8)}${rows.length + 1})`,
        Number(row.total),
        XLSX_STYLES.totalNumber,
      ),
    ]);
  }
  const lastDataRow = rows.length;

  rows.push([
    text("Total por día", XLSX_STYLES.totalLabel),
    text("", XLSX_STYLES.totalLabel),
    ...report.tramiteTotalsPerDay.map((value, index) =>
      formula(
        `SUM(${columnLetter(index + 2)}${firstDataRow}:${columnLetter(index + 2)}${lastDataRow})`,
        Number(value),
        XLSX_STYLES.totalNumber,
      ),
    ),
    formula(
      `SUM(${columnLetter(2)}${firstDataRow}:${columnLetter(8)}${lastDataRow})`,
      Number(report.tramiteGrandTotal),
      XLSX_STYLES.totalNumber,
    ),
  ]);

  rows.push([]);
  rows.push([text("Indicadores de gestión", XLSX_STYLES.section)]);
  rows.push([
    text("Indicador", XLSX_STYLES.header),
    text("", XLSX_STYLES.header),
    ...dayHeaders.map((label) => text(label, XLSX_STYLES.header)),
    text("Total", XLSX_STYLES.header),
  ]);
  const indicatorFirst = rows.length + 1;
  for (const row of report.indicatorRows) {
    rows.push([
      text("", XLSX_STYLES.label),
      text(INDICATOR_LABELS[row.indicator], XLSX_STYLES.label),
      ...row.perDay.map((value) => num(value, XLSX_STYLES.number)),
      formula(
        `SUM(${columnLetter(2)}${rows.length + 1}:${columnLetter(8)}${rows.length + 1})`,
        Number(row.total),
        XLSX_STYLES.totalNumber,
      ),
    ]);
  }
  const indicatorLast = rows.length;
  rows.push([
    text("", XLSX_STYLES.totalLabel),
    text("Total indicadores", XLSX_STYLES.totalLabel),
    ...WEEK_DAYS.map((_, index) =>
      formula(
        `SUM(${columnLetter(index + 2)}${indicatorFirst}:${columnLetter(index + 2)}${indicatorLast})`,
        0,
        XLSX_STYLES.totalNumber,
      ),
    ),
    formula(
      `SUM(${columnLetter(2)}${indicatorFirst}:${columnLetter(8)}${indicatorLast})`,
      0,
      XLSX_STYLES.totalNumber,
    ),
  ]);

  return {
    name: "Formato 1",
    rows,
    columnWidths: [10, 34, 11, 11, 11, 11, 11, 11, 11, 12],
    freezeRows: 4,
  };
}

function buildFormato2Sheet(report: WeeklyReport): XlsxSheet {
  const dayHeaders = WEEK_DAYS.map((day) => WEEK_DAY_LABELS[day]);
  const rows: XlsxRow[] = [
    [text("CPNNA · Formato 2 — Población Atendida", XLSX_STYLES.title)],
    [text(`Semana: ${report.rangeLabel}`, XLSX_STYLES.subtitle)],
    [],
    [
      text("Rango etario", XLSX_STYLES.header),
      text("Femenino", XLSX_STYLES.header),
      text("Masculino", XLSX_STYLES.header),
      text("Total", XLSX_STYLES.header),
    ],
  ];

  const firstDataRow = rows.length + 1;
  for (const row of report.demographicRows) {
    rows.push([
      text(AGE_RANGE_LABELS[row.ageRange], XLSX_STYLES.label),
      num(row.perGender[GenderEnum.femenino], XLSX_STYLES.number),
      num(row.perGender[GenderEnum.masculino], XLSX_STYLES.number),
      formula(
        `SUM(B${rows.length + 1}:C${rows.length + 1})`,
        Number(row.total),
        XLSX_STYLES.totalNumber,
      ),
    ]);
  }
  const lastDataRow = rows.length;
  rows.push([
    text("Total", XLSX_STYLES.totalLabel),
    formula(
      `SUM(B${firstDataRow}:B${lastDataRow})`,
      Number(
        report.demographicRows.reduce(
          (sum, row) => sum + row.perGender[GenderEnum.femenino],
          0n,
        ),
      ),
      XLSX_STYLES.totalNumber,
    ),
    formula(
      `SUM(C${firstDataRow}:C${lastDataRow})`,
      Number(
        report.demographicRows.reduce(
          (sum, row) => sum + row.perGender[GenderEnum.masculino],
          0n,
        ),
      ),
      XLSX_STYLES.totalNumber,
    ),
    formula(
      `SUM(D${firstDataRow}:D${lastDataRow})`,
      Number(report.demographicGrandTotal),
      XLSX_STYLES.totalNumber,
    ),
  ]);

  rows.push([]);
  rows.push([text("Población atendida por día", XLSX_STYLES.section)]);
  rows.push([
    text("Día", XLSX_STYLES.header),
    ...dayHeaders.map((label) => text(label, XLSX_STYLES.header)),
  ]);
  rows.push([
    text("Total del día", XLSX_STYLES.totalLabel),
    ...report.demographicTotalsPerDay.map((value) =>
      num(value, XLSX_STYLES.totalNumber),
    ),
  ]);

  return {
    name: "Formato 2",
    rows,
    columnWidths: [28, 14, 14, 14, 12, 12, 12, 12, 12, 12],
    freezeRows: 4,
  };
}

function buildKpiSheet(report: WeeklyReport): XlsxSheet {
  const rows: XlsxRow[] = [
    [text("CPNNA · Resumen de KPIs", XLSX_STYLES.title)],
    [text(`Semana: ${report.rangeLabel}`, XLSX_STYLES.subtitle)],
    [],
    [
      text("Indicador", XLSX_STYLES.header),
      text("Valor", XLSX_STYLES.header),
      text("Nota", XLSX_STYLES.header),
    ],
  ];

  for (const kpi of report.kpis) {
    rows.push([
      text(kpi.label, XLSX_STYLES.label),
      text(kpi.value, XLSX_STYLES.number),
      text(kpi.hint ?? "", XLSX_STYLES.label),
    ]);
  }

  rows.push([]);
  rows.push([text("Alertas de auditoría", XLSX_STYLES.section)]);
  rows.push([
    text("Día", XLSX_STYLES.header),
    text("Formato 1", XLSX_STYLES.header),
    text("Formato 2", XLSX_STYLES.header),
    text("Diferencia", XLSX_STYLES.header),
  ]);

  if (report.alerts.length === 0) {
    rows.push([
      text("Sin discrepancias entre Formato 1 y Formato 2", XLSX_STYLES.label),
      text("", XLSX_STYLES.label),
      text("", XLSX_STYLES.label),
      text("", XLSX_STYLES.label),
    ]);
  } else {
    for (const alert of report.alerts) {
      rows.push([
        text(WEEK_DAY_LABELS[alert.day], XLSX_STYLES.label),
        num(alert.format1Total, XLSX_STYLES.number),
        num(alert.format2Total, XLSX_STYLES.number),
        num(alert.format1Total - alert.format2Total, XLSX_STYLES.number),
      ]);
    }
  }

  return {
    name: "Resumen KPIs",
    rows,
    columnWidths: [34, 16, 26, 14],
    freezeRows: 4,
  };
}

/** Construye las tres hojas del consolidado semanal. */
export function buildReportSheets(report: WeeklyReport): XlsxSheet[] {
  return [
    buildFormato1Sheet(report),
    buildFormato2Sheet(report),
    buildKpiSheet(report),
  ];
}

/** Nombre de archivo sugerido para el consolidado. */
export function reportFileName(weekStart: string): string {
  const dates = weekDates(weekStart);
  return `consolidado-semanal_${dates[0]}_${dates[6]}.xlsx`;
}
