import { Card } from "@/components/ui/card";
import { formatCount, formatDecimal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

export interface RankingRow {
  id: string;
  name: string;
  category: string;
  count: bigint;
  share: number;
}

interface TramiteRankingProps {
  rows: RankingRow[];
  totalTramites: bigint;
  loading?: boolean;
}

/** Ranking de trámites con mayor movimiento y su porcentaje sobre la carga total. */
export function TramiteRanking({
  rows,
  totalTramites,
  loading = false,
}: TramiteRankingProps) {
  const max = rows.reduce(
    (acc, row) => (row.count > acc ? row.count : acc),
    0n,
  );

  return (
    <Card
      data-ocid="panel.ranking_card"
      className="gap-4 rounded-lg border-border py-5 shadow-subtle"
    >
      <div className="flex items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Trophy className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Trámites con mayor movimiento
            </h2>
            <p className="text-xs text-muted-foreground">
              Porcentaje sobre la carga operativa total
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Total
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatCount(totalTramites)}
          </span>
        </span>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => `rank-skeleton-${i}`).map(
              (id) => (
                <div key={id} className="h-10 animate-pulse rounded bg-muted" />
              ),
            )}
          </div>
        ) : rows.length === 0 ? (
          <p
            data-ocid="panel.ranking_empty_state"
            className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
          >
            Aún no hay trámites registrados en esta semana.
          </p>
        ) : (
          <ol data-ocid="panel.ranking_list" className="space-y-3">
            {rows.map((row, index) => {
              const width = max > 0n ? Number((row.count * 100n) / max) : 0;
              return (
                <li
                  key={row.id}
                  data-ocid={`panel.ranking_item.${index + 1}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground sm:inline">
                        {row.category}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCount(row.count)}
                      </span>
                      <span className="w-12 text-right font-mono text-xs tabular-nums text-accent">
                        {formatDecimal(row.share)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-accent transition-smooth",
                        index === 0 && "bg-primary",
                      )}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
