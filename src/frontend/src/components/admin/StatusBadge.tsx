import { ApprovalStatus } from "@/backend";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, ShieldX } from "lucide-react";

const STATUS_META: Record<
  ApprovalStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  [ApprovalStatus.pending]: {
    label: "Pendiente",
    className: "bg-warning/15 text-warning",
    Icon: Clock,
  },
  [ApprovalStatus.approved]: {
    label: "Aprobado",
    className: "bg-success/15 text-success",
    Icon: CheckCircle2,
  },
  [ApprovalStatus.rejected]: {
    label: "Rechazado",
    className: "bg-destructive/12 text-destructive",
    Icon: ShieldX,
  },
};

/** Insignia de estado de aprobación con color y texto institucional. */
export function StatusBadge({
  status,
  className,
}: {
  status: ApprovalStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
