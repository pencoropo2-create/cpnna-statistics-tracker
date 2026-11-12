import type { WeekDay } from "@/backend";
import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { WEEK_DAY_SHORT } from "@/lib/week";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export interface DailyPoint {
  day: WeekDay;
  label: string;
  usuarios: number;
  tramites: number;
}

interface DailyComparisonChartProps {
  data: DailyPoint[];
  loading?: boolean;
}

const chartConfig = {
  usuarios: { label: "Usuarios", color: "var(--chart-1)" },
  tramites: { label: "Trámites", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Gráfico de barras comparativo del total diario (usuarios y trámites) Vie → Jue. */
export function DailyComparisonChart({
  data,
  loading = false,
}: DailyComparisonChartProps) {
  const hasData = data.some(
    (point) => point.usuarios > 0 || point.tramites > 0,
  );

  return (
    <Card
      data-ocid="panel.daily_chart_card"
      className="gap-4 rounded-lg border-border py-5 shadow-subtle"
    >
      <div className="flex items-center gap-2 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Total diario de la semana
          </h2>
          <p className="text-xs text-muted-foreground">
            Usuarios y trámites de Viernes a Jueves
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-5">
        {loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        ) : !hasData ? (
          <p
            data-ocid="panel.daily_chart_empty_state"
            className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground"
          >
            Sin movimientos registrados en esta semana.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            data-ocid="panel.daily_chart"
            className="aspect-auto h-64 w-full"
          >
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="usuarios"
                fill="var(--color-usuarios)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="tramites"
                fill="var(--color-tramites)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Card>
  );
}

/** Etiqueta corta del día para el eje del gráfico. */
export function dayAxisLabel(day: WeekDay): string {
  return WEEK_DAY_SHORT[day];
}
