import { createActor } from "@/backend";
import type {
  AccessSummary,
  ManagementIndicator,
  Tramite,
  WeekId,
  WeekInput,
  WeekRecord,
  WeekSummary,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Resumen de acceso del usuario que consulta (estado, aprobación, rol admin). */
export function useAccessSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AccessSummary>({
    queryKey: ["accessSummary"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getAccessSummary();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

/** Catálogo completo de trámites y medidas. */
export function useTramites() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Tramite[]>({
    queryKey: ["tramites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTramites();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

/** Indicadores de gestión soportados. */
export function useIndicators() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ManagementIndicator[]>({
    queryKey: ["indicators"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listIndicators();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

/** Resúmenes de las semanas del usuario que captura. */
export function useWeeks() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WeekSummary[]>({
    queryKey: ["weeks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWeeks();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Lee una semana concreta del usuario que captura. */
export function useWeek(id: WeekId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WeekRecord | null>({
    queryKey: ["week", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getWeek(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/** Crea una semana estadística nueva. */
export function useCreateWeek() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: WeekInput) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createWeek(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weeks"] });
    },
  });
}

/** Actualiza una semana existente. */
export function useUpdateWeek() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: WeekId; input: WeekInput }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateWeek(id, input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["weeks"] });
      void queryClient.invalidateQueries({
        queryKey: ["week", variables.id.toString()],
      });
    },
  });
}

/** Elimina una semana del usuario que la captura. */
export function useDeleteWeek() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: WeekId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteWeek(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weeks"] });
    },
  });
}

/** Solicita acceso al administrador. */
export function useRequestApproval() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.requestApproval();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accessSummary"] });
    },
  });
}
