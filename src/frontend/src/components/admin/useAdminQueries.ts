import { createActor } from "@/backend";
import type {
  ApprovalStatus,
  AuditAlert,
  InviteInfo,
  UserApprovalInfo,
  WeekId,
  WeekTotals,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Solicitudes y miembros con su estado de aprobación (solo administradores). */
export function useApprovals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Aprueba o rechaza una solicitud de acceso. */
export function useSetApproval() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: {
      user: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["accessSummary"] });
    },
  });
}

/** Elimina la entrada de aprobación para que la persona pueda volver a solicitar. */
export function useRemoveApproval() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeApproval(user);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

/** Enlaces de invitación creados por los administradores. */
export function useInvites() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<InviteInfo[]>({
    queryKey: ["invites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listInvites();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Totales de una semana concreta para la vista de auditoría. */
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

/** Alertas de auditoría (brechas de validación) de una semana concreta. */
export function useWeekAlerts(id: WeekId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditAlert[]>({
    queryKey: ["weekAlerts", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return [];
      return actor.getWeekAlerts(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}
