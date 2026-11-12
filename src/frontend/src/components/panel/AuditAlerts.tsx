import type { AuditAlert } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCount } from "@/lib/format";
import { WEEK_DAY_LABELS } from "@/lib/week";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface AuditAlertsProps {
  alerts: AuditAlert[];
  loading?: boolean;
  onOpenDay: (day: AuditAlert["day"]) => void;
}

/** Alertas de auditoría automática: días cuyo desglose no coincide con el total. */
export function AuditAlerts({
  alerts,
  loading = false,
  onOpenDay,
}: AuditAlertsProps) {
  return (
    <Card
      data-ocid="panel.alerts_card"
      className="gap-4 rounded-lg border-border py-5 shadow-subtle"
    >
      <div className="flex items-center gap-2 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-warning/20 text-warning">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Alertas de auditoría
          </h2>
          <p className="text-xs text-muted-foreground">
            Días con desglose demográfico inconsistente
          </p>
        </div>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => `alert-skeleton-${i}`).map(
              (id) => (
                <div
                  key={id}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ),
            )}
          </div>
        ) : alerts.length === 0 ? (
          <div
            data-ocid="panel.alerts_empty_state"
            className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-5"
          >
            <ShieldCheck
              className="size-5 shrink-0 text-success"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground">
              Sin brechas de validación: el desglose demográfico coincide con el
              total de usuarios en todos los días.
            </p>
          </div>
        ) : (
          <ul data-ocid="panel.alerts_list" className="space-y-3">
            {alerts.map((alert, index) => {
              const diff =
                alert.format1Total > alert.format2Total
                  ? alert.format1Total - alert.format2Total
                  : alert.format2Total - alert.format1Total;
              return (
                <li
                  key={alert.day}
                  data-ocid={`panel.alert_item.${index + 1}`}
                  className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AlertTriangle
                        className="size-4 shrink-0 text-warning"
                        aria-hidden="true"
                      />
                      {WEEK_DAY_LABELS[alert.day]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formato 1: {formatCount(alert.format1Total)} · Formato 2:{" "}
                      {formatCount(alert.format2Total)} · Diferencia:{" "}
                      <span className="font-mono font-semibold tabular-nums text-warning">
                        {formatCount(diff)}
                      </span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid={`panel.alert_open_button.${index + 1}`}
                    onClick={() => onOpenDay(alert.day)}
                    className="h-9 shrink-0 rounded-lg border-warning/50 bg-card text-xs text-foreground hover:bg-warning/15"
                  >
                    Ver día
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
