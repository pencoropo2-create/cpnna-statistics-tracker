import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useInviteRedemption } from "@caffeineai/user-approval";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Redime un enlace de invitación (?invite=…) en cualquier ruta.
 * Mientras hay una invitación activa, sustituye la pantalla de acceso.
 */
export function InviteGate({ children }: { children: ReactNode }) {
  const { actor } = useActor(createActor);
  const { isAuthenticated, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const { status, error, hasInvite, retry, dismiss } = useInviteRedemption(
    actor,
    isAuthenticated,
    { onJoined: () => void queryClient.invalidateQueries() },
  );

  if (!hasInvite || status === "joined" || status === "alreadyMember") {
    return <>{children}</>;
  }

  return (
    <section
      aria-label="Invitación"
      data-ocid="invite.panel"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-7" aria-hidden="true" />
      </div>
      {status === "valid" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Te invitaron a CPNNA
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Inicia sesión con Internet Identity para unirte al registro
            estadístico.
          </p>
          <Button
            type="button"
            data-ocid="invite.signin_button"
            disabled={isInitializing || isLoggingIn}
            onClick={() => login()}
            className="h-11 rounded-lg px-6"
          >
            {isInitializing || isLoggingIn
              ? "Iniciando sesión…"
              : "Iniciar sesión para unirme"}
          </Button>
        </>
      )}
      {(status === "checking" ||
        status === "redeeming" ||
        status === "none") && (
        <>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Verificando tu invitación
          </h1>
          <output
            data-ocid="invite.loading_state"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Un momento…
          </output>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            No pudimos verificar la invitación
          </h1>
          <p
            role="alert"
            data-ocid="invite.error_state"
            className="max-w-md text-sm text-destructive"
          >
            {error ?? "Ocurrió un error inesperado."}
          </p>
          <Button
            type="button"
            data-ocid="invite.retry_button"
            onClick={retry}
            className="h-11 rounded-lg px-6"
          >
            Reintentar
          </Button>
        </>
      )}
      {status === "blocked" && (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Tu acceso fue retirado
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Un administrador revocó tu acceso. Contacta al administrador si
            crees que es un error.
          </p>
          <Button
            type="button"
            variant="outline"
            data-ocid="invite.dismiss_button"
            onClick={dismiss}
            className="h-11 rounded-lg px-6"
          >
            Continuar
          </Button>
        </>
      )}
      {(status === "expired" ||
        status === "revoked" ||
        status === "usedUp" ||
        status === "invalid") && (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Este enlace ya no funciona
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Pide al administrador un enlace de invitación nuevo.
          </p>
          <Button
            type="button"
            variant="outline"
            data-ocid="invite.dismiss_button"
            onClick={dismiss}
            className="h-11 rounded-lg px-6"
          >
            Continuar
          </Button>
        </>
      )}
    </section>
  );
}
