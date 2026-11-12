import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WEEK_DAYS,
  WEEK_DAY_SHORT,
  addWeeks,
  isCurrentWeek,
  parseIsoDate,
  weekDates,
  weekRangeLabel,
  weekStartOf,
} from "@/lib/week";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface WeekSelectorProps {
  /** Fecha ISO del viernes que inicia la semana activa. */
  weekStart: string;
  onChange: (weekStart: string) => void;
  /** Día del ciclo seleccionado dentro de la semana (opcional). */
  activeDay?: string;
  onDayChange?: (iso: string) => void;
}

/**
 * Selector de semana estadística con ciclo Viernes → Jueves.
 * Muestra siempre la semana activa y permite navegar a semanas anteriores
 * y a la semana en curso.
 */
export function WeekSelector({
  weekStart,
  onChange,
  activeDay,
  onDayChange,
}: WeekSelectorProps) {
  const dates = weekDates(weekStart);
  const current = isCurrentWeek(weekStart);

  return (
    <div data-ocid="week.selector" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="week.pagination_prev"
          aria-label="Semana anterior"
          onClick={() => onChange(addWeeks(weekStart, -1))}
          className="size-11 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>

        <div className="flex min-w-0 flex-col items-center">
          <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Semana estadística
          </span>
          <span
            data-ocid="week.active_label"
            className="truncate font-display text-sm font-semibold text-foreground sm:text-base"
          >
            {weekRangeLabel(weekStart)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!current && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="week.current_button"
              onClick={() => onChange(weekStartOf(new Date()))}
              className="hidden h-9 rounded-lg px-3 text-xs sm:inline-flex"
            >
              Semana en curso
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid="week.pagination_next"
            aria-label="Semana siguiente"
            disabled={current}
            onClick={() => onChange(addWeeks(weekStart, 1))}
            className="size-11 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl overflow-x-auto px-3 pb-2 sm:px-4">
        <div className="flex min-w-max gap-1">
          {dates.map((iso, index) => {
            const day = WEEK_DAYS[index];
            const isActive = activeDay === iso;
            const date = parseIsoDate(iso);
            return (
              <button
                key={iso}
                type="button"
                data-ocid={`week.day.${index + 1}`}
                aria-pressed={isActive}
                onClick={() => onDayChange?.(iso)}
                className={cn(
                  "flex min-w-[3.75rem] flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-center transition-smooth",
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider">
                  {WEEK_DAY_SHORT[day]}
                </span>
                <span className="font-mono text-base font-semibold tabular-nums">
                  {date.getDate()}
                </span>
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full",
                    isActive ? "bg-accent" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
