import type { WeekDay } from "@/backend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WEEK_DAY_LABELS } from "@/lib/week";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface DayDiscrepancy {
  day: WeekDay;
  /** Total demográfico capturado en el Formato 2 para ese día. */
  format2Total: number;
  /** Total de usuarios reportado por el Formato 1 para ese día. */
  format1Total: number;
}

interface DiscrepancyAlertProps {
  discrepancies: DayDiscrepancy[];
}

/**
 * Validación cruzada Formato 2 ↔ Formato 1.
 * Cuando el total demográfico de un día difiere del total de usuarios del
 * Formato 1, se muestra una alerta con el día, ambos valores y la diferencia.
 * Si coinciden todos los días, se confirma la consistencia.
 */
export function DiscrepancyAlert({ discrepancies }: DiscrepancyAlertProps) {
  if (discrepancies.length === 0) {
    return (
      <Alert
        data-ocid="formato2.crosscheck.success_state"
        className="border-success/40 bg-success/10 text-foreground [&>svg]:text-success"
      >
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle className="text-success">
          Totales consistentes con el Formato 1
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          El total diario de usuarios atendidos coincide con el reportado en el
          Formato 1 para cada día de la semana.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      data-ocid="formato2.crosscheck.error_state"
      className="border-warning/50 bg-warning/10 text-foreground [&>svg]:text-warning"
    >
      <AlertTriangle aria-hidden="true" />
      <AlertTitle className="text-warning">
        {discrepancies.length === 1
          ? "Discrepancia detectada en 1 día"
          : `Discrepancia detectada en ${discrepancies.length} días`}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        <p>
          El total demográfico del Formato 2 no coincide con el total de
          usuarios del Formato 1. Un trámite familiar puede involucrar a varios
          miembros o representantes, por lo que es normal que los totales
          difieran.
        </p>
        <ul className="mt-2 space-y-1.5">
          {discrepancies.map((item) => {
            const diff = item.format2Total - item.format1Total;
            return (
              <li
                key={item.day}
                data-ocid={`formato2.crosscheck.item.${item.day}`}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md border border-warning/30 bg-card px-3 py-2"
              >
                <span className="font-display text-sm font-semibold text-foreground">
                  {WEEK_DAY_LABELS[item.day]}
                </span>
                <span className="text-xs text-muted-foreground">
                  Formato 2:{" "}
                  <span className="font-mono tabular-nums text-foreground">
                    {item.format2Total}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Formato 1:{" "}
                  <span className="font-mono tabular-nums text-foreground">
                    {item.format1Total}
                  </span>
                </span>
                <span className="text-xs font-semibold text-warning">
                  Diferencia:{" "}
                  <span className="font-mono tabular-nums">
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
