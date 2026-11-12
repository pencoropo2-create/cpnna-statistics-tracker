import { ApprovalStatus } from "@/backend";
import type { UserApprovalInfo } from "@/backend";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  useApprovals,
  useRemoveApproval,
  useSetApproval,
} from "@/components/admin/useAdminQueries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

/** Acorta un principal para mostrarlo en pantallas pequeñas. */
function shortPrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-5)}`;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <Icon className="size-7 text-muted-foreground" aria-hidden="true" />
      <p className="font-display text-sm font-semibold text-foreground">
        {title}
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function MemberRow({
  member,
  index,
  onApprove,
  onReject,
  onRemove,
  onAllowAgain,
  pending,
}: {
  member: UserApprovalInfo;
  index: number;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
  onAllowAgain: () => void;
  pending: boolean;
}) {
  const principal = member.principal.toText();
  const isPending = member.status === ApprovalStatus.pending;
  const isApproved = member.status === ApprovalStatus.approved;

  return (
    <li
      data-ocid={`admin.member.${index + 1}`}
      className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-foreground sm:text-sm">
            {shortPrincipal(principal)}
          </span>
          <StatusBadge status={member.status} />
        </span>
        <span className="truncate font-mono text-[0.65rem] text-muted-foreground">
          {principal}
        </span>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {isPending && (
          <>
            <Button
              type="button"
              size="sm"
              data-ocid={`admin.approve_button.${index + 1}`}
              disabled={pending}
              onClick={onApprove}
              className="h-10 rounded-lg px-3"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Aprobar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-ocid={`admin.reject_button.${index + 1}`}
              disabled={pending}
              onClick={onReject}
              className="h-10 rounded-lg border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <UserX className="size-4" aria-hidden="true" />
              Rechazar
            </Button>
          </>
        )}
        {isApproved && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-ocid={`admin.remove_button.${index + 1}`}
            disabled={pending}
            onClick={onRemove}
            className="h-10 rounded-lg border-destructive/40 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <ShieldAlert className="size-4" aria-hidden="true" />
            Retirar acceso
          </Button>
        )}
        {member.status === ApprovalStatus.rejected && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-ocid={`admin.allow_again_button.${index + 1}`}
            disabled={pending}
            onClick={onAllowAgain}
            className="h-10 rounded-lg px-3"
          >
            <UserCheck className="size-4" aria-hidden="true" />
            Permitir de nuevo
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Gestión de accesos: solicitudes pendientes, miembros aprobados y
 * personas rechazadas. Cada acción confirma con un aviso claro.
 */
export function AccessRequestsPanel() {
  const { data: approvals, isLoading, isError, refetch } = useApprovals();
  const setApproval = useSetApproval();
  const removeApproval = useRemoveApproval();

  const busy = setApproval.isPending || removeApproval.isPending;

  const handleApprove = (member: UserApprovalInfo) => {
    setApproval.mutate(
      { user: member.principal, status: ApprovalStatus.approved },
      {
        onSuccess: () =>
          toast.success("Solicitud aprobada", {
            description: "La persona ya puede registrar y consultar datos.",
          }),
        onError: () =>
          toast.error("No se pudo aprobar la solicitud", {
            description: "Inténtalo de nuevo en unos segundos.",
          }),
      },
    );
  };

  const handleReject = (member: UserApprovalInfo) => {
    setApproval.mutate(
      { user: member.principal, status: ApprovalStatus.rejected },
      {
        onSuccess: () =>
          toast.success("Solicitud rechazada", {
            description: "La persona no podrá ingresar al registro.",
          }),
        onError: () =>
          toast.error("No se pudo rechazar la solicitud", {
            description: "Inténtalo de nuevo en unos segundos.",
          }),
      },
    );
  };

  const handleRemove = (member: UserApprovalInfo) => {
    setApproval.mutate(
      { user: member.principal, status: ApprovalStatus.rejected },
      {
        onSuccess: () =>
          toast.success("Acceso retirado", {
            description: "El miembro ya no puede ingresar al registro.",
          }),
        onError: () =>
          toast.error("No se pudo retirar el acceso", {
            description: "Inténtalo de nuevo en unos segundos.",
          }),
      },
    );
  };

  const handleAllowAgain = (member: UserApprovalInfo) => {
    removeApproval.mutate(member.principal, {
      onSuccess: () =>
        toast.success("Acceso habilitado de nuevo", {
          description: "La persona puede volver a solicitar acceso.",
        }),
      onError: () =>
        toast.error("No se pudo habilitar el acceso", {
          description: "Inténtalo de nuevo en unos segundos.",
        }),
    });
  };

  if (isLoading) {
    return (
      <div data-ocid="admin.requests.loading_state" className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => `admin-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-16 w-full rounded-lg" />
          ),
        )}
      </div>
    );
  }

  if (isError || !approvals) {
    return (
      <div
        data-ocid="admin.requests.error_state"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-8 text-center"
      >
        <ShieldAlert className="size-7 text-destructive" aria-hidden="true" />
        <p role="alert" className="text-sm text-foreground">
          No pudimos cargar las solicitudes de acceso.
        </p>
        <Button
          type="button"
          variant="outline"
          data-ocid="admin.requests.retry_button"
          onClick={() => void refetch()}
          className="h-10 rounded-lg px-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const pending = approvals.filter((m) => m.status === ApprovalStatus.pending);
  const approved = approvals.filter(
    (m) => m.status === ApprovalStatus.approved,
  );
  const rejected = approvals.filter(
    (m) => m.status === ApprovalStatus.rejected,
  );

  return (
    <div className="space-y-6">
      <section data-ocid="admin.requests.section" className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-foreground">
            Solicitudes pendientes
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Sin solicitudes pendientes"
            description="Cuando alguien solicite acceso aparecerá aquí para que lo apruebes o rechaces."
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border bg-card">
            {pending.map((member, index) => (
              <MemberRow
                key={member.principal.toText()}
                member={member}
                index={index}
                pending={busy}
                onApprove={() => handleApprove(member)}
                onReject={() => handleReject(member)}
                onRemove={() => handleRemove(member)}
                onAllowAgain={() => handleAllowAgain(member)}
              />
            ))}
          </ul>
        )}
      </section>

      <section data-ocid="admin.members.section" className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-foreground">
            Miembros con acceso
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {approved.length}
          </span>
        </div>
        {approved.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Aún no hay miembros aprobados"
            description="Aprueba una solicitud para que la persona pueda ingresar al registro."
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border bg-card">
            {approved.map((member, index) => (
              <MemberRow
                key={member.principal.toText()}
                member={member}
                index={index}
                pending={busy}
                onApprove={() => handleApprove(member)}
                onReject={() => handleReject(member)}
                onRemove={() => handleRemove(member)}
                onAllowAgain={() => handleAllowAgain(member)}
              />
            ))}
          </ul>
        )}
      </section>

      {rejected.length > 0 && (
        <section data-ocid="admin.rejected.section" className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Accesos rechazados
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {rejected.length}
            </span>
          </div>
          <ul className="overflow-hidden rounded-lg border border-border bg-card">
            {rejected.map((member, index) => (
              <MemberRow
                key={member.principal.toText()}
                member={member}
                index={index}
                pending={busy}
                onApprove={() => handleApprove(member)}
                onReject={() => handleReject(member)}
                onRemove={() => handleRemove(member)}
                onAllowAgain={() => handleAllowAgain(member)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
