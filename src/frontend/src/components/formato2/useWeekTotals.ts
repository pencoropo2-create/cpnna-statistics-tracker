import { createActor } from "@/backend";
import type { WeekId, WeekTotals } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/**
 * Totales calculados de una semana (por día, por trámite, por rango etario).
 * Se usa para la validación cruzada del Formato 2 contra el Formato 1.
 */
export function useWeekTotals(id: WeekId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WeekTotals | null>({
    queryKey: ["weekTotals", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getWeekTotals(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}
