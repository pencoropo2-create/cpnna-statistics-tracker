import { AccessRequestsPanel } from "@/components/admin/AccessRequestsPanel";
import { AuditPanel } from "@/components/admin/AuditPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccessSummary, useWeeks } from "@/hooks/useQueries";
import { ClipboardList, ShieldAlert, Users } from "lucide-react";

/**
 * Administración de accesos — aprobación de solicitudes y auditoría
 * de los registros semanales capturados.
 */
export default function AdminPage() {
  const { data: summary, isLoading: summaryLoading } = useAccessSummary();
  const {
    data: weeks,
    isLoading: weeksLoading,
    isError: weeksError,
    refetch: refetchWeeks,
  } = useWeeks();

  const isAdmin = summary?.isAdmin ?? false;

  if (summaryLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="Administración"
          title="Accesos y auditoría"
          description="Aprueba o rechaza solicitudes de acceso y consulta la auditoría de registros."
        />
        <div
          data-ocid="admin.loading_state"
          className="mx-auto max-w-6xl space-y-3 px-4 py-6"
        >
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="Administración"
          title="Accesos y auditoría"
          description="Aprueba o rechaza solicitudes de acceso y consulta la auditoría de registros."
        />
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div
            data-ocid="admin.denied_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center"
          >
            <ShieldAlert
              className="size-8 text-destructive"
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Acceso restringido
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Esta sección es exclusiva para administradores del registro. Si
              necesitas gestionar accesos, solicita el rol de administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Administración"
        title="Accesos y auditoría"
        description="Aprueba o rechaza solicitudes de acceso y consulta la auditoría de registros."
      />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="access" data-ocid="admin.tabs">
          <TabsList className="h-11 w-full justify-start gap-1 rounded-lg bg-muted p-1 sm:w-auto">
            <TabsTrigger
              value="access"
              data-ocid="admin.access.tab"
              className="h-9 gap-2 rounded-md px-3 text-sm"
            >
              <Users className="size-4" aria-hidden="true" />
              Accesos
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              data-ocid="admin.audit.tab"
              className="h-9 gap-2 rounded-md px-3 text-sm"
            >
              <ClipboardList className="size-4" aria-hidden="true" />
              Auditoría
            </TabsTrigger>
          </TabsList>

          <TabsContent value="access" className="mt-5">
            <AccessRequestsPanel />
          </TabsContent>

          <TabsContent value="audit" className="mt-5">
            <AuditPanel
              weeks={weeks}
              isLoading={weeksLoading}
              isError={weeksError}
              onRetry={() => void refetchWeeks()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
