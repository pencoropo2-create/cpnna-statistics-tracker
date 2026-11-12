import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCount } from "@/lib/format";
import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

export interface AgeSlice {
  key: string;
  label: string;
  count: bigint;
  color: string;
}

interface AgeDistributionChartProps {
  slices: AgeSlice[];
  total: bigint;
  loading?: boolean;
}

const chartConfig = {
  count: { label: "Usuarios" },
} satisfies ChartConfig;

/** Gráfico circular de la población atendida por grupo etario. */
export function AgeDistributionChart({
  slices,
  total,
  loading = false,
}: AgeDistributionChartProps) {
  const data = slices.map((slice) => ({
    key: slice.key,
    label: slice.label,
    count: Number(slice.count),
    fill: slice.color,
  }));
  const hasData = data.some((slice) => slice.count > 0);

  return (
    <Card
      data-ocid="panel.age_chart_card"
      className="gap-4 rounded-lg border-border py-5 shadow-subtle"
    >
      <div className="flex items-center gap-2 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <PieIcon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Población por grupo etario
          </h2>
          <p className="text-xs text-muted-foreground">
            Distribución demográfica de la semana
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-5">
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        ) : !hasData ? (
          <p
            data-ocid="panel.age_chart_empty_state"
            className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
          >
            Sin desglose demográfico registrado.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ChartContainer
              config={chartConfig}
              data-ocid="panel.age_chart"
              className="aspect-square h-52 w-full max-w-[13rem]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent nameKey="label" hideLabel />}
                />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((slice) => (
                    <Cell key={slice.key} fill={slice.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="label" />} />
              </PieChart>
            </ChartContainer>

            <ul
              data-ocid="panel.age_legend"
              className="w-full flex-1 space-y-2"
            >
              {slices.map((slice) => {
                const share =
                  total > 0n ? Number((slice.count * 1000n) / total) / 10 : 0;
                return (
                  <li
                    key={slice.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: slice.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-muted-foreground">
                        {slice.label}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCount(slice.count)}
                      </span>
                      <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {share.toFixed(1)}%
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
