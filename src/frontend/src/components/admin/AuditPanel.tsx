import type { AuditAlert, WeekSummary } from "@/backend";
import { useWeekAlerts } from "@/components/admin/useAdminQueries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WEEK_DAY_LABELS, weekRangeLabel } from "@/lib/week";
import {
  AlertTriangle,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useState } from "react";

function GapBadge({ hasDiscrepancy }: { hasDiscrepancy: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        hasDiscrepancy
          ? "bg-warning/15 text-warning"
          : "bg-success/15 text-success",
      )}
    >
      {hasDiscrepancy ? (
        <AlertTriangle className="size-3.5" aria-hidden="true" />
      ) : (
        <ClipboardList className="size-3.5" aria-hidden="true" />
      )}
      {hasDiscrepancy ? "Brecha de validación" : "Sin brechas"}
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="flex flex-col leading-tight">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

function AlertList({ weekId }: { weekId: WeekSummary["id"] }) {
  const { data: alerts, isLoading } = useWeekAlerts(weekId);

  if (isLoading) {
    return (
      <output className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Cargando alertas…
      </output>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        No hay brechas de validación en esta semana.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {alerts.map((alert: AuditAlert) => (
        <li
          key={alert.day}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
        >
          <span className="text-xs font-medium text-foreground">
            {WEEK_DAY_LABELS[alert.day]}
          </span>
          <span className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
            <span>Formato 1: {formatCount(alert.format1Total)}</span>
            <span>Formato 2: {formatCount(alert.format2Total)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function WeekCard({ week, index }: { week: WeekSummary; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <li
      data-ocid={`admin.audit.item.${index + 1}`}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarRange
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate font-display text-sm font-semibold text-foreground">
              {weekRangeLabel(week.startDate)}
            </span>
          </div>
          <GapBadge hasDiscrepancy={week.hasDiscrepancy} />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Metric
            icon={ClipboardList}
            label="Trámites"
            value={formatCount(week.totalTramites)}
          />
          <Metric
            icon={Users}
            label="Usuarios"
            value={formatCount(week.totalUsuarios)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.65rem] text-muted-foreground">
            Actualizado: {formatTimestamp(week.updatedAt)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid={`admin.audit.toggle.${index + 1}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="h-9 rounded-lg px-3 text-xs"
          >
            {open ? "Ocultar detalle" : "Ver detalle"}
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-muted/30">
          <p className="px-4 pt-3 text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Brechas de validación por día
          </p>
          <AlertList weekId={week.id} />
        </div>
      )}
    </li>
  );
}

/**
 * Auditoría de los registros semanales capturados: cada semana con sus
 * totales y si presenta una brecha de validación.
 */
export function AuditPanel({
  weeks,
  isLoading,
  isError,
  onRetry,
}: {
  weeks: WeekSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div data-ocid="admin.audit.loading_state" className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `audit-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-32 w-full rounded-lg" />
          ),
        )}
      </div>
    );
  }

  if (isError || !weeks) {
    return (
      <div
        data-ocid="admin.audit.error_state"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-8 text-center"
      >
        <ShieldAlert className="size-7 text-destructive" aria-hidden="true" />
        <p role="alert" className="text-sm text-foreground">
          No pudimos cargar los registros semanales.
        </p>
        <Button
          type="button"
          variant="outline"
          data-ocid="admin.audit.retry_button"
          onClick={onRetry}
          className="h-10 rounded-lg px-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div
        data-ocid="admin.audit.empty_state"
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center"
      >
        <ClipboardList
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="font-display text-sm font-semibold text-foreground">
          Aún no hay registros semanales
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Cuando se capturen semanas estadísticas aparecerán aquí con sus
          totales y su estado de validación.
        </p>
      </div>
    );
  }

  const withGaps = weeks.filter((week) => week.hasDiscrepancy).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="size-4" aria-hidden="true" />
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {weeks.length}
          </span>
          semanas registradas
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle
            className={cn(
              "size-4",
              withGaps > 0 ? "text-warning" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {withGaps}
          </span>
          con brecha de validación
        </span>
      </div>

      <ul data-ocid="admin.audit.list" className="space-y-3">
        {weeks.map((week, index) => (
          <WeekCard key={week.id.toString()} week={week} index={index} />
        ))}
      </ul>
    </div>
  );
}
