import { cn } from "@/lib/utils";

interface NumericCellProps {
  /** Identificador estable para pruebas deterministas. */
  ocid: string;
  /** Valor en texto del borrador (estado local). */
  value: string;
  /** Etiqueta accesible del campo (trámite + día). */
  label: string;
  /** Marca la celda como inválida (vacía, negativa o no numérica). */
  invalid: boolean;
  /** Mensaje de error mostrado dentro de la celda. */
  error?: string;
  /** Notifica cada cambio de texto al borrador. */
  onChange: (value: string) => void;
}

/**
 * Celda numérica del ledger: teclado numérico, validación en vivo y error
 * mostrado en la propia celda. Los dígitos usan monoespaciado tabular para
 * alinear las columnas como un formulario impreso.
 */
export function NumericCell({
  ocid,
  value,
  label,
  invalid,
  error,
  onChange,
}: NumericCellProps) {
  return (
    <div className="group/cell relative flex items-stretch">
      <input
        data-ocid={ocid}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 w-full min-w-[3.25rem] rounded-md border bg-card px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth",
          "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40",
          invalid
            ? "border-destructive/70 bg-destructive/5 text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
            : "border-input hover:border-accent/50",
        )}
      />
      {invalid && error && (
        <span
          role="alert"
          className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-destructive/40 bg-card px-2 py-0.5 text-[0.6rem] font-semibold text-destructive shadow-elevated"
        >
          {error}
        </span>
      )}
    </div>
  );
}
