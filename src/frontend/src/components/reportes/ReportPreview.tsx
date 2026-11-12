import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCount } from "@/lib/format";
import {
  AGE_RANGE_LABELS,
  GENDER_LABELS,
  INDICATOR_LABELS,
  type WeeklyReport,
} from "@/lib/report";
import { cn } from "@/lib/utils";
import { WEEK_DAYS, WEEK_DAY_LABELS, WEEK_DAY_SHORT } from "@/lib/week";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ReportPreviewProps {
  report: WeeklyReport;
}

const TH =
  "whitespace-nowrap border-b border-border bg-primary px-2.5 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-primary-foreground";
const TH_NUM = cn(TH, "text-right");
const TD = "border-b border-border px-2.5 py-1.5 text-sm text-foreground";
const TD_NUM = cn(TD, "text-right font-mono tabular-nums");
const TD_TOTAL = cn(
  "border-b border-border bg-secondary px-2.5 py-1.5 text-sm font-semibold text-secondary-foreground",
);
const TD_TOTAL_NUM = cn(TD_TOTAL, "text-right font-mono tabular-nums");

/** Vista previa del consolidado semanal con pestañas por hoja. */
export function ReportPreview({ report }: ReportPreviewProps) {
  return (
    <Tabs
      defaultValue="formato1"
      data-ocid="reportes.preview"
      className="gap-3"
    >
      <TabsList
        data-ocid="reportes.preview.tabs"
        className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted p-1"
      >
        <TabsTrigger
          value="formato1"
          data-ocid="reportes.preview.tab.formato1"
          className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-subtle sm:text-sm"
        >
          Formato 1
        </TabsTrigger>
        <TabsTrigger
          value="formato2"
          data-ocid="reportes.preview.tab.formato2"
          className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-subtle sm:text-sm"
        >
          Formato 2
        </TabsTrigger>
        <TabsTrigger
          value="kpis"
          data-ocid="reportes.preview.tab.kpis"
          className="rounded-md px-3 py-1.5 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-subtle sm:text-sm"
        >
          Resumen KPIs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="formato1" className="mt-0">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table
            data-ocid="reportes.preview.table.formato1"
            className="w-full min-w-[46rem] border-collapse"
          >
            <caption className="sr-only">
              Formato 1 — Actividades semanales por trámite y día
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Código
                </th>
                <th scope="col" className={TH}>
                  Trámite o medida
                </th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} scope="col" className={TH_NUM}>
                    <span className="hidden sm:inline">
                      {WEEK_DAY_LABELS[day]}
                    </span>
                    <span className="sm:hidden">{WEEK_DAY_SHORT[day]}</span>
                  </th>
                ))}
                <th scope="col" className={TH_NUM}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {report.tramiteRows.map((row, index) => (
                <tr
                  key={row.tramite.id.toString()}
                  data-ocid={`reportes.preview.formato1.row.${index + 1}`}
                  className="transition-smooth hover:bg-muted/50"
                >
                  <td
                    className={cn(
                      TD,
                      "font-mono text-xs text-muted-foreground",
                    )}
                  >
                    {row.tramite.code}
                  </td>
                  <td className={cn(TD, "min-w-[12rem]")}>
                    {row.tramite.name}
                  </td>
                  {row.perDay.map((value, dayIndex) => (
                    <td
                      key={WEEK_DAYS[dayIndex]}
                      className={cn(
                        TD_NUM,
                        value === 0n && "text-muted-foreground",
                      )}
                    >
                      {formatCount(value)}
                    </td>
                  ))}
                  <td className={TD_TOTAL_NUM}>{formatCount(row.total)}</td>
                </tr>
              ))}
              <tr data-ocid="reportes.preview.formato1.total_row">
                <td className={TD_TOTAL} colSpan={2}>
                  Total por día
                </td>
                {report.tramiteTotalsPerDay.map((value, dayIndex) => (
                  <td key={WEEK_DAYS[dayIndex]} className={TD_TOTAL_NUM}>
                    {formatCount(value)}
                  </td>
                ))}
                <td className={TD_TOTAL_NUM}>
                  {formatCount(report.tramiteGrandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
          <table
            data-ocid="reportes.preview.table.indicadores"
            className="w-full min-w-[46rem] border-collapse"
          >
            <caption className="sr-only">
              Indicadores de gestión por día
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TH} colSpan={2}>
                  Indicadores de gestión
                </th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} scope="col" className={TH_NUM}>
                    <span className="hidden sm:inline">
                      {WEEK_DAY_LABELS[day]}
                    </span>
                    <span className="sm:hidden">{WEEK_DAY_SHORT[day]}</span>
                  </th>
                ))}
                <th scope="col" className={TH_NUM}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {report.indicatorRows.map((row, index) => (
                <tr
                  key={row.indicator}
                  data-ocid={`reportes.preview.indicador.row.${index + 1}`}
                  className="transition-smooth hover:bg-muted/50"
                >
                  <td className={TD} colSpan={2}>
                    {INDICATOR_LABELS[row.indicator]}
                  </td>
                  {row.perDay.map((value, dayIndex) => (
                    <td
                      key={WEEK_DAYS[dayIndex]}
                      className={cn(
                        TD_NUM,
                        value === 0n && "text-muted-foreground",
                      )}
                    >
                      {formatCount(value)}
                    </td>
                  ))}
                  <td className={TD_TOTAL_NUM}>{formatCount(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="formato2" className="mt-0">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table
            data-ocid="reportes.preview.table.formato2"
            className="w-full min-w-[32rem] border-collapse"
          >
            <caption className="sr-only">
              Formato 2 — Población atendida por rango etario y género
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Rango etario
                </th>
                <th scope="col" className={TH_NUM}>
                  {GENDER_LABELS.femenino}
                </th>
                <th scope="col" className={TH_NUM}>
                  {GENDER_LABELS.masculino}
                </th>
                <th scope="col" className={TH_NUM}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {report.demographicRows.map((row, index) => (
                <tr
                  key={row.ageRange}
                  data-ocid={`reportes.preview.formato2.row.${index + 1}`}
                  className="transition-smooth hover:bg-muted/50"
                >
                  <td className={TD}>{AGE_RANGE_LABELS[row.ageRange]}</td>
                  <td className={TD_NUM}>
                    {formatCount(row.perGender.femenino)}
                  </td>
                  <td className={TD_NUM}>
                    {formatCount(row.perGender.masculino)}
                  </td>
                  <td className={TD_TOTAL_NUM}>{formatCount(row.total)}</td>
                </tr>
              ))}
              <tr data-ocid="reportes.preview.formato2.total_row">
                <td className={TD_TOTAL}>Total</td>
                <td className={TD_TOTAL_NUM}>
                  {formatCount(
                    report.demographicRows.reduce(
                      (sum, row) => sum + row.perGender.femenino,
                      0n,
                    ),
                  )}
                </td>
                <td className={TD_TOTAL_NUM}>
                  {formatCount(
                    report.demographicRows.reduce(
                      (sum, row) => sum + row.perGender.masculino,
                      0n,
                    ),
                  )}
                </td>
                <td className={TD_TOTAL_NUM}>
                  {formatCount(report.demographicGrandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
          <table
            data-ocid="reportes.preview.table.formato2.dias"
            className="w-full min-w-[32rem] border-collapse"
          >
            <caption className="sr-only">Población atendida por día</caption>
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Día
                </th>
                {WEEK_DAYS.map((day) => (
                  <th key={day} scope="col" className={TH_NUM}>
                    <span className="hidden sm:inline">
                      {WEEK_DAY_LABELS[day]}
                    </span>
                    <span className="sm:hidden">{WEEK_DAY_SHORT[day]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={TD_TOTAL}>Total del día</td>
                {report.demographicTotalsPerDay.map((value, dayIndex) => (
                  <td key={WEEK_DAYS[dayIndex]} className={TD_TOTAL_NUM}>
                    {formatCount(value)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="kpis" className="mt-0">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Alertas de auditoría
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Discrepancias entre el total del Formato 1 y el del Formato 2 por
            día.
          </p>
          {report.alerts.length === 0 ? (
            <div
              data-ocid="reportes.preview.alerts.empty_state"
              className="mt-3 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-sm text-foreground"
            >
              <CheckCircle2
                className="size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              Sin discrepancias: los totales de ambos formatos coinciden.
            </div>
          ) : (
            <ul
              data-ocid="reportes.preview.alerts.list"
              className="mt-3 space-y-2"
            >
              {report.alerts.map((alert, index) => (
                <li
                  key={alert.day}
                  data-ocid={`reportes.preview.alerts.item.${index + 1}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <AlertTriangle
                      className="size-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    {WEEK_DAY_LABELS[alert.day]}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    Formato 1: {formatCount(alert.format1Total)} · Formato 2:{" "}
                    {formatCount(alert.format2Total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
