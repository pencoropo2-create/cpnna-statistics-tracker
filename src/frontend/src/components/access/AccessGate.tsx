import { AccessRequestStatus } from "@/backend";
import { SignInButton } from "@/components/InternetIdentity";
import { Button } from "@/components/ui/button";
import { useAccessSummary, useRequestApproval } from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Clock, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import type { ReactNode } from "react";

function BrandMark() {
  return (
    <div className="flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
      <ShieldCheck className="size-8" aria-hidden="true" />
    </div>
  );
}

function CenteredPanel({
  children,
  ocid,
}: {
  children: ReactNode;
  ocid: string;
}) {
  return (
    <section
      aria-label="Acceso"
      data-ocid={ocid}
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center"
    >
      {children}
    </section>
  );
}

/**
 * Puerta de acceso privada: exige sesión y aprobación de un administrador.
 * Sin sesión muestra el inicio de sesión; con sesión pendiente, la espera.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const { identity, isInitializing, isLoggingIn } = useInternetIdentity();
  const principal =
    identity && !identity.getPrincipal().isAnonymous()
      ? identity.getPrincipal().toText()
      : undefined;

  if (isInitializing || isLoggingIn) {
    return (
      <CenteredPanel ocid="access.loading_state">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <output className="text-sm text-muted-foreground">
          Cargando tu sesión…
        </output>
      </CenteredPanel>
    );
  }

  if (principal === undefined) {
    return (
      <CenteredPanel ocid="access.signin_panel">
        <BrandMark />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            CPNNA · Registro Estadístico
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Acceso institucional
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Inicia sesión con Internet Identity. El acceso es privado: un
            administrador debe aprobar tu solicitud antes de que puedas
            registrar datos.
          </p>
        </div>
        <SignInButton className="h-11 rounded-lg bg-primary px-6 font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
      </CenteredPanel>
    );
  }

  return <ApprovalBoundary key={principal}>{children}</ApprovalBoundary>;
}

/** Consulta el resumen de acceso solo cuando ya hay sesión. */
function ApprovalBoundary({ children }: { children: ReactNode }) {
  const { data: summary, isPending, isError, refetch } = useAccessSummary();
  const requestApproval = useRequestApproval();

  if (isPending) {
    return (
      <CenteredPanel ocid="access.loading_state">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <output className="text-sm text-muted-foreground">
          Verificando tu acceso…
        </output>
      </CenteredPanel>
    );
  }

  if (isError || !summary) {
    return (
      <CenteredPanel ocid="access.error_state">
        <ShieldX className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold text-foreground">
          No pudimos verificar tu acceso
        </h1>
        <p role="alert" className="max-w-md text-sm text-muted-foreground">
          Revisa tu conexión e inténtalo de nuevo.
        </p>
        <Button
          type="button"
          data-ocid="access.retry_button"
          onClick={() => void refetch()}
          className="h-11 rounded-lg px-6"
        >
          Reintentar
        </Button>
      </CenteredPanel>
    );
  }

  if (summary.isApproved || summary.isAdmin) {
    return <>{children}</>;
  }

  if (summary.status === AccessRequestStatus.rejected) {
    return (
      <CenteredPanel ocid="access.rejected_panel">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="size-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Acceso no autorizado
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu solicitud de acceso fue rechazada. Contacta al administrador del
          registro si necesitas ingresar.
        </p>
        <SignInButton className="h-11 rounded-lg border border-input bg-background px-6 font-medium text-foreground transition-smooth hover:bg-muted" />
      </CenteredPanel>
    );
  }

  return (
    <CenteredPanel ocid="access.pending_panel">
      <div className="flex size-16 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Clock className="size-8" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Solicitud pendiente de aprobación
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Tu solicitud de acceso fue enviada. Un administrador debe aprobarla
          antes de que puedas registrar o consultar datos.
        </p>
      </div>
      {summary.status === AccessRequestStatus.pending ? (
        <p
          data-ocid="access.pending_status"
          className="rounded-full bg-warning/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-warning"
        >
          En espera de aprobación
        </p>
      ) : (
        <Button
          type="button"
          data-ocid="access.request_button"
          disabled={requestApproval.isPending}
          onClick={() => requestApproval.mutate()}
          className="h-11 rounded-lg px-6"
        >
          {requestApproval.isPending
            ? "Enviando solicitud…"
            : "Solicitar acceso"}
        </Button>
      )}
      {requestApproval.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo enviar la solicitud. Inténtalo de nuevo.
        </p>
      )}
      <SignInButton className="h-11 rounded-lg border border-input bg-background px-6 font-medium text-foreground transition-smooth hover:bg-muted" />
    </CenteredPanel>
  );
}
