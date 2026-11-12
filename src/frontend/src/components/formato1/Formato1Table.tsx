import type {
  ManagementIndicator,
  Tramite,
  TramiteCategory,
  WeekDay,
} from "@/backend";
import { NumericCell } from "@/components/formato1/NumericCell";
import {
  type DraftTotals,
  type Formato1Draft,
  validateCell,
} from "@/components/formato1/useFormato1Draft";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WEEK_DAYS, WEEK_DAY_LABELS, WEEK_DAY_SHORT } from "@/lib/week";

/** Etiquetas en español de las categorías del catálogo. */
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

/** Etiquetas en español de los indicadores de gestión. */
export const INDICATOR_LABELS: Record<ManagementIndicator, string> = {
  seguimientoCausa: "Seguimiento de causa",
  expedientesAperturados: "Expedientes aperturados",
  entrevistas: "Entrevistas",
};

interface Formato1TableProps {
  tramites: Tramite[];
  indicators: ManagementIndicator[];
  draft: Formato1Draft;
  totals: DraftTotals;
  /** Día del ciclo resaltado (opcional). */
  activeDay?: WeekDay;
  onTramiteChange: (tramiteId: string, day: WeekDay, value: string) => void;
  onIndicatorChange: (indicator: string, day: WeekDay, value: string) => void;
}

interface CategoryGroup {
  category: TramiteCategory;
  tramites: Tramite[];
}

/** Agrupa los trámites por categoría conservando el orden del catálogo. */
function groupByCategory(tramites: Tramite[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];
  const index = new Map<TramiteCategory, number>();
  for (const tramite of tramites) {
    const existing = index.get(tramite.category);
    if (existing === undefined) {
      index.set(tramite.category, groups.length);
      groups.push({ category: tramite.category, tramites: [tramite] });
    } else {
      groups[existing].tramites.push(tramite);
    }
  }
  return groups;
}

/**
 * Tabla del Formato 1: ledger de trámites por día con sumas horizontales y
 * verticales calculadas por el sistema. La primera columna es fija y el resto
 * se desplaza horizontalmente en pantallas pequeñas.
 */
export function Formato1Table({
  tramites,
  indicators,
  draft,
  totals,
  activeDay,
  onTramiteChange,
  onIndicatorChange,
}: Formato1TableProps) {
  const groups = groupByCategory(tramites);

  return (
    <div
      data-ocid="formato1.table"
      className="overflow-x-auto rounded-lg border border-border bg-card"
    >
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">
          Registro diario de trámites y medidas del Formato 1
        </caption>
        <thead>
          <tr className="bg-muted/60">
            <th
              scope="col"
              className="sticky left-0 z-20 min-w-[13rem] border-b border-r border-border bg-muted/60 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Trámite o medida
            </th>
            {WEEK_DAYS.map((day) => (
              <th
                key={day}
                scope="col"
                className={cn(
                  "border-b border-border px-1 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider",
                  activeDay === day
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground",
                )}
              >
                <span className="block">{WEEK_DAY_SHORT[day]}</span>
                <span className="sr-only">{WEEK_DAY_LABELS[day]}</span>
              </th>
            ))}
            <th
              scope="col"
              className="border-b border-l border-border bg-primary/5 px-2 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-primary"
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {groups.map((group) => (
            <FragmentGroup
              key={group.category}
              group={group}
              draft={draft}
              totals={totals}
              activeDay={activeDay}
              onTramiteChange={onTramiteChange}
            />
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-muted/50">
            <th
              scope="row"
              className="sticky left-0 z-10 border-t-2 border-border bg-muted/50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Total trámites por día
            </th>
            {WEEK_DAYS.map((day) => (
              <td
                key={day}
                data-ocid={`formato1.total_tramites.${day}`}
                className="border-t-2 border-border px-1 py-2 text-center font-mono text-sm font-semibold tabular-nums text-foreground"
              >
                {formatCount(totals.perDayTramites[day])}
              </td>
            ))}
            <td
              data-ocid="formato1.total_tramites.general"
              className="border-t-2 border-l border-border bg-primary/5 px-2 py-2 text-center font-mono text-sm font-bold tabular-nums text-primary"
            >
              {formatCount(totals.totalTramites)}
            </td>
          </tr>

          <tr className="bg-muted/50">
            <th
              scope="row"
              className="sticky left-0 z-10 border-t border-border bg-muted/50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Usuarios atendidos por día
            </th>
            {WEEK_DAYS.map((day) => (
              <td
                key={day}
                data-ocid={`formato1.total_usuarios.${day}`}
                className="border-t border-border px-1 py-2 text-center font-mono text-sm font-semibold tabular-nums text-foreground"
              >
                {formatCount(totals.perDayUsuarios[day])}
              </td>
            ))}
            <td
              data-ocid="formato1.total_usuarios.general"
              className="border-t border-l border-border bg-primary/5 px-2 py-2 text-center font-mono text-sm font-bold tabular-nums text-primary"
            >
              {formatCount(totals.totalUsuarios)}
            </td>
          </tr>

          <tr className="bg-accent/5">
            <th
              scope="row"
              colSpan={WEEK_DAYS.length + 2}
              className="border-t-2 border-accent/30 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-accent"
            >
              Indicadores de gestión
            </th>
          </tr>

          {indicators.map((indicator) => (
            <tr key={indicator} className="bg-accent/5">
              <th
                scope="row"
                className="sticky left-0 z-10 border-t border-accent/20 bg-accent/5 px-3 py-1.5 text-left text-xs font-medium text-foreground"
              >
                {INDICATOR_LABELS[indicator]}
              </th>
              {WEEK_DAYS.map((day) => {
                const value = draft.indicators[indicator]?.[day] ?? "";
                const validation = validateCell(value);
                return (
                  <td
                    key={day}
                    className="border-t border-accent/20 px-1 py-1.5 align-middle"
                  >
                    <NumericCell
                      ocid={`formato1.indicator.${indicator.toLowerCase()}.${day}`}
                      value={value}
                      label={`${INDICATOR_LABELS[indicator]} — ${WEEK_DAY_LABELS[day]}`}
                      invalid={!validation.valid}
                      error={validation.error}
                      onChange={(next) =>
                        onIndicatorChange(indicator, day, next)
                      }
                    />
                  </td>
                );
              })}
              <td
                data-ocid={`formato1.indicator_total.${indicator.toLowerCase()}`}
                className="border-t border-l border-accent/20 bg-accent/10 px-2 py-1.5 text-center font-mono text-sm font-semibold tabular-nums text-accent"
              >
                {formatCount(totals.perIndicator[indicator] ?? 0n)}
              </td>
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}

interface FragmentGroupProps {
  group: CategoryGroup;
  draft: Formato1Draft;
  totals: DraftTotals;
  activeDay?: WeekDay;
  onTramiteChange: (tramiteId: string, day: WeekDay, value: string) => void;
}

/** Bloque de una categoría: fila de grupo y sus trámites. */
function FragmentGroup({
  group,
  draft,
  totals,
  activeDay,
  onTramiteChange,
}: FragmentGroupProps) {
  return (
    <>
      <tr className="bg-muted/40">
        <th
          scope="colgroup"
          colSpan={WEEK_DAYS.length + 2}
          className="sticky left-0 border-y border-border px-3 py-1.5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {CATEGORY_LABELS[group.category]}
        </th>
      </tr>
      {group.tramites.map((tramite) => {
        const key = tramite.id.toString();
        const cells = draft.tramites[key];
        return (
          <tr key={key} className="group/row hover:bg-muted/30">
            <th
              scope="row"
              className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-1.5 text-left align-middle group-hover/row:bg-muted/30"
            >
              <span className="block font-mono text-[0.65rem] font-semibold text-muted-foreground">
                {tramite.code}
              </span>
              <span className="block text-xs font-medium leading-snug text-foreground">
                {tramite.name}
              </span>
            </th>
            {WEEK_DAYS.map((day) => {
              const value = cells?.[day] ?? "";
              const validation = validateCell(value);
              return (
                <td
                  key={day}
                  className={cn(
                    "border-b border-border px-1 py-1.5 align-middle",
                    activeDay === day && "bg-accent/5",
                  )}
                >
                  <NumericCell
                    ocid={`formato1.cell.${key}.${day}`}
                    value={value}
                    label={`${tramite.name} — ${WEEK_DAY_LABELS[day]}`}
                    invalid={!validation.valid}
                    error={validation.error}
                    onChange={(next) => onTramiteChange(key, day, next)}
                  />
                </td>
              );
            })}
            <td
              data-ocid={`formato1.row_total.${key}`}
              className="border-b border-l border-border bg-primary/5 px-2 py-1.5 text-center font-mono text-sm font-semibold tabular-nums text-primary"
            >
              {formatCount(totals.perTramite[key] ?? 0n)}
            </td>
          </tr>
        );
      })}
    </>
  );
}
