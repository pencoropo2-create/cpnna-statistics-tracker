import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCount } from "@/lib/format";
import type { WeeklyReport } from "@/lib/report";
import { cn } from "@/lib/utils";
import { Loader2, Mail, Send } from "lucide-react";
import { useState } from "react";

interface ReportEmailPanelProps {
  report: WeeklyReport;
  /** Envía el consolidado al correo indicado. Devuelve un mensaje de error o null. */
  onSend: (email: string) => Promise<string | null>;
  /** Indica si el servicio de correo está disponible en el backend. */
  available: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Panel de envío del consolidado por correo institucional. */
export function ReportEmailPanel({
  report,
  onSend,
  available,
}: ReportEmailPanelProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const trimmed = email.trim();
  const isValid = EMAIL_PATTERN.test(trimmed);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) {
      setError("Ingresa un correo institucional válido.");
      return;
    }
    setError(null);
    setIsSending(true);
    const message = await onSend(trimmed);
    setIsSending(false);
    if (message) {
      setError(message);
    }
  }

  return (
    <form
      data-ocid="reportes.email.panel"
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Enviar por correo institucional
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Se enviará el consolidado de la semana {report.rangeLabel} con los
            totales de Formato 1, Formato 2 y los KPIs.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="reportes-email" className="text-xs font-medium">
          Correo destinatario
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="reportes-email"
            data-ocid="reportes.email.input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="direccion@institucion.gob"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "reportes-email-error" : undefined}
            className="h-11 rounded-lg sm:h-10"
          />
          <Button
            type="submit"
            data-ocid="reportes.email.submit_button"
            disabled={isSending || !available}
            className="h-11 shrink-0 rounded-lg px-4 sm:h-10"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {isSending ? "Enviando…" : "Enviar reporte"}
          </Button>
        </div>

        {error && (
          <p
            id="reportes-email-error"
            data-ocid="reportes.email.error_state"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </p>
        )}

        {!available && (
          <p
            data-ocid="reportes.email.unavailable_state"
            className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-foreground"
          >
            El envío por correo aún no está habilitado en el servidor. Puedes
            descargar el archivo .xlsx y adjuntarlo manualmente.
          </p>
        )}

        <p className="text-[0.7rem] text-muted-foreground">
          Resumen: {formatCount(report.tramiteGrandTotal)} trámites ·{" "}
          {formatCount(report.demographicGrandTotal)} personas atendidas ·{" "}
          {report.alerts.length === 0
            ? "sin discrepancias"
            : `${report.alerts.length} alerta(s)`}
        </p>
      </div>
    </form>
  );
}
