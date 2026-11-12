import {
  AgeRange,
  type AuditAlert,
  Gender,
  ManagementIndicator,
  type Tramite,
  TramiteCategory,
  WeekDay,
  type WeekRecord,
  type WeekTotals,
} from "@/backend";
import {
  buildReportSheets,
  buildWeeklyReport,
  reportFileName,
} from "@/lib/report";
import { buildXlsx } from "@/lib/xlsx";
import { describe, expect, it } from "vitest";

const TRAMITES: Tramite[] = [
  {
    id: 1n,
    order: 1n,
    code: "AC-01",
    name: "Apertura de causa por solicitud",
    category: TramiteCategory.aperturaCausa,
  },
  {
    id: 2n,
    order: 2n,
    code: "MC-01",
    name: "Medida de cuidado en familia de origen",
    category: TramiteCategory.medidaCuidado,
  },
];

const WEEK: WeekRecord = {
  id: 1n,
  owner: { toText: () => "aaaaa-aa" } as unknown as WeekRecord["owner"],
  startDate: "2026-09-11",
  createdAt: 0n,
  updatedAt: 0n,
  tramiteCounts: [
    { tramiteId: 1n, day: WeekDay.viernes, count: 3n },
    { tramiteId: 1n, day: WeekDay.lunes, count: 4n },
    { tramiteId: 2n, day: WeekDay.viernes, count: 5n },
  ],
  indicatorCounts: [
    {
      indicator: ManagementIndicator.seguimientoCausa,
      day: WeekDay.viernes,
      count: 2n,
    },
  ],
  demographics: [
    {
      day: WeekDay.viernes,
      ageRange: AgeRange.nino0a5,
      gender: Gender.femenino,
      count: 2n,
    },
    {
      day: WeekDay.viernes,
      ageRange: AgeRange.nino0a5,
      gender: Gender.masculino,
      count: 3n,
    },
  ],
};

const TOTALS: WeekTotals = {
  totalTramites: 12n,
  totalUsuarios: 12n,
  totalDemografico: 5n,
  perDayTramites: [[WeekDay.viernes, 8n]],
  perDayUsuarios: [[WeekDay.viernes, 5n]],
  perTramite: [
    [1n, 7n],
    [2n, 5n],
  ],
  perAgeRange: [[AgeRange.nino0a5, 5n]],
  hasDiscrepancy: true,
};

const ALERTS: AuditAlert[] = [
  { day: WeekDay.viernes, format1Total: 8n, format2Total: 5n },
];

describe("buildWeeklyReport", () => {
  it("aggregates trámite rows, per-day totals and the grand total", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);

    expect(report.tramiteRows).toHaveLength(2);
    expect(report.tramiteRows[0].total).toBe(7n);
    expect(report.tramiteRows[1].total).toBe(5n);
    // Viernes: 3 + 5 = 8; Lunes: 4.
    expect(report.tramiteTotalsPerDay[0]).toBe(8n);
    expect(report.tramiteTotalsPerDay[3]).toBe(4n);
    expect(report.tramiteGrandTotal).toBe(12n);
  });

  it("aggregates demographic rows by age range and gender", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);
    const nino = report.demographicRows.find(
      (row) => row.ageRange === AgeRange.nino0a5,
    );
    expect(nino?.perGender[Gender.femenino]).toBe(2n);
    expect(nino?.perGender[Gender.masculino]).toBe(3n);
    expect(nino?.total).toBe(5n);
    expect(report.demographicGrandTotal).toBe(5n);
  });

  it("exposes the audit alerts and a discrepancy KPI", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);
    expect(report.alerts).toHaveLength(1);
    const kpi = report.kpis.find((k) => k.label === "Días con discrepancia");
    expect(kpi?.value).toBe("1");
  });
});

describe("buildReportSheets", () => {
  it("produces separate Formato 1, Formato 2 and KPI sheets", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);
    const sheets = buildReportSheets(report);
    expect(sheets.map((s) => s.name)).toEqual([
      "Formato 1",
      "Formato 2",
      "Resumen KPIs",
    ]);
  });

  it("uses formulas for the total cells", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);
    const [formato1, formato2] = buildReportSheets(report);

    const formulaCells = formato1.rows
      .flat()
      .filter((cell) => cell.value.kind === "formula");
    expect(formulaCells.length).toBeGreaterThan(0);
    expect(
      formulaCells.some(
        (cell) =>
          cell.value.kind === "formula" &&
          cell.value.formula.startsWith("SUM("),
      ),
    ).toBe(true);

    const formato2Formulas = formato2.rows
      .flat()
      .filter((cell) => cell.value.kind === "formula");
    expect(formato2Formulas.length).toBeGreaterThan(0);
  });

  it("builds a downloadable xlsx binary with the workbook parts", () => {
    const report = buildWeeklyReport(WEEK, TRAMITES, TOTALS, ALERTS);
    const bytes = buildXlsx(buildReportSheets(report));
    expect(bytes.length).toBeGreaterThan(0);
    // Firma ZIP local file header "PK\x03\x04".
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("names the file after the week range", () => {
    expect(reportFileName("2026-09-11")).toBe(
      "consolidado-semanal_2026-09-11_2026-09-17.xlsx",
    );
  });
});
