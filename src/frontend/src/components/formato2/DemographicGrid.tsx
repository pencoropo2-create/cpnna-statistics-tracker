import type { WeekDay } from "@/backend";
import {
  AGE_RANGES,
  AGE_RANGE_LABELS,
  type DemographicDraft,
  GENDERS,
  GENDER_LABELS,
  ageRangeSubtotal,
  cellKey,
  cellValue,
  dayTotal,
  genderSubtotal,
  isCellValid,
} from "@/components/formato2/demographics";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { WEEK_DAY_LABELS } from "@/lib/week";

interface DemographicGridProps {
  day: WeekDay;
  draft: DemographicDraft;
  onCellChange: (key: string, value: string) => void;
  /** Total de usuarios del Formato 1 para este día, si existe. */
  format1Total: number | null;
}

/**
 * Rejilla de captura diaria del Formato 2: rangos etarios × género con
 * subtotales por rango, por género y total diario. Cada celda es un campo
 * numérico obligatorio con teclado numérico y validación en vivo.
 */
export function DemographicGrid({
  day,
  draft,
  onCellChange,
  format1Total,
}: DemographicGridProps) {
  const total = dayTotal(draft, day);
  const hasDiscrepancy = format1Total !== null && total !== format1Total;

  return (
    <section
      data-ocid="formato2.grid"
      aria-label={`Captura del ${WEEK_DAY_LABELS[day]}`}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          {WEEK_DAY_LABELS[day]}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Total del día
          </span>
          <span
            data-ocid="formato2.day_total"
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-base font-bold tabular-nums",
              hasDiscrepancy
                ? "bg-warning/15 text-warning"
                : "bg-primary/10 text-primary",
            )}
          >
            {total}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th
                scope="col"
                className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Rango etario
              </th>
              {GENDERS.map((gender) => (
                <th
                  key={gender}
                  scope="col"
                  className="px-3 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  {GENDER_LABELS[gender]}
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {AGE_RANGES.map((ageRange, index) => (
              <tr
                key={ageRange}
                data-ocid={`formato2.row.${index + 1}`}
                className="border-b border-border last:border-b-0 odd:bg-muted/20"
              >
                <th
                  scope="row"
                  className="px-3 py-2 text-left text-sm font-medium text-foreground"
                >
                  {AGE_RANGE_LABELS[ageRange]}
                </th>
                {GENDERS.map((gender) => {
                  const key = cellKey(day, ageRange, gender);
                  const raw = draft[key] ?? "";
                  const invalid = raw.trim() !== "" && !isCellValid(raw);
                  return (
                    <td key={gender} className="px-2 py-1.5">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        aria-label={`${AGE_RANGE_LABELS[ageRange]} ${GENDER_LABELS[gender]}`}
                        aria-invalid={invalid}
                        data-ocid={`formato2.input.${index + 1}.${gender}`}
                        value={raw}
                        onChange={(event) =>
                          onCellChange(key, event.target.value)
                        }
                        className={cn(
                          "h-11 w-full min-w-[3.5rem] rounded-md border-input bg-background px-2 text-center font-mono text-base tabular-nums",
                          invalid && "border-destructive text-destructive",
                        )}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {ageRangeSubtotal(draft, day, ageRange)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/50">
              <th
                scope="row"
                className="px-3 py-2.5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Subtotal por género
              </th>
              {GENDERS.map((gender) => (
                <td key={gender} className="px-3 py-2.5 text-center">
                  <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                    {genderSubtotal(draft, day, gender)}
                  </span>
                </td>
              ))}
              <td className="px-3 py-2.5 text-center">
                <span className="font-mono text-base font-bold tabular-nums text-primary">
                  {total}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasDiscrepancy && (
        <p
          data-ocid="formato2.day_discrepancy_note"
          className="border-t border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning"
        >
          El total del día ({total}) difiere del Formato 1 ({format1Total}).
        </p>
      )}
    </section>
  );
}
