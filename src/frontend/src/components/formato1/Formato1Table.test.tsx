import type { ManagementIndicator, Tramite, WeekDay } from "@/backend";
import { ManagementIndicator as Indicator, TramiteCategory } from "@/backend";
import { Formato1Table } from "@/components/formato1/Formato1Table";
import {
  type Formato1Draft,
  computeDraftTotals,
  emptyDraft,
} from "@/components/formato1/useFormato1Draft";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

const TRAMITES: Tramite[] = [
  {
    id: 1n,
    order: 1n,
    code: "AC-01",
    name: "Apertura de causa por solicitud",
    category: TramiteCategory.aperturaCausa,
  },
  {
    id: 2n,
    order: 2n,
    code: "MC-01",
    name: "Medida de cuidado en familia de origen",
    category: TramiteCategory.medidaCuidado,
  },
];

const INDICATORS: ManagementIndicator[] = [
  Indicator.seguimientoCausa,
  Indicator.expedientesAperturados,
  Indicator.entrevistas,
];

/** Arranque controlado: la tabla es un componente presentacional con estado local. */
function Harness({ initial }: { initial?: Formato1Draft }) {
  const [draft, setDraft] = useState<Formato1Draft>(
    () => initial ?? emptyDraft(TRAMITES, INDICATORS),
  );
  const totals = computeDraftTotals(draft);
  return (
    <Formato1Table
      tramites={TRAMITES}
      indicators={INDICATORS}
      draft={draft}
      totals={totals}
      onTramiteChange={(tramiteId, day, value) =>
        setDraft((current) => ({
          ...current,
          tramites: {
            ...current.tramites,
            [tramiteId]: { ...current.tramites[tramiteId], [day]: value },
          },
        }))
      }
      onIndicatorChange={(indicator, day, value) =>
        setDraft((current) => ({
          ...current,
          indicators: {
            ...current.indicators,
            [indicator]: { ...current.indicators[indicator], [day]: value },
          },
        }))
      }
    />
  );
}

function cell(ocid: string): HTMLInputElement {
  return screen.getByTestId(ocid) as HTMLInputElement;
}

describe("Formato1Table", () => {
  it("renders the management indicators row with its three labels", () => {
    render(<Harness />);
    expect(screen.getByText("Seguimiento de causa")).toBeInTheDocument();
    expect(screen.getByText("Expedientes aperturados")).toBeInTheDocument();
    expect(screen.getByText("Entrevistas")).toBeInTheDocument();
  });

  it("recomputes the horizontal row total and vertical day totals live", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(cell("formato1.cell.1.viernes"));
    await user.type(cell("formato1.cell.1.viernes"), "3");
    await user.clear(cell("formato1.cell.1.lunes"));
    await user.type(cell("formato1.cell.1.lunes"), "4");
    await user.clear(cell("formato1.cell.2.viernes"));
    await user.type(cell("formato1.cell.2.viernes"), "5");

    // Suma horizontal de la fila 1: 3 (viernes) + 4 (lunes) = 7.
    expect(screen.getByTestId("formato1.row_total.1")).toHaveTextContent("7");
    // Suma vertical del viernes: 3 + 5 = 8.
    expect(
      screen.getByTestId("formato1.total_tramites.viernes"),
    ).toHaveTextContent("8");
    // Suma vertical del lunes: 4.
    expect(
      screen.getByTestId("formato1.total_tramites.lunes"),
    ).toHaveTextContent("4");
    // Total general: 3 + 4 + 5 = 12.
    expect(
      screen.getByTestId("formato1.total_tramites.general"),
    ).toHaveTextContent("12");
  });

  it("shows a live error and keeps the invalid value out of the totals", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const target = cell("formato1.cell.1.viernes");
    await user.clear(target);
    await user.type(target, "-5");

    expect(target).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Solo números");
    // El valor inválido no suma al total de la fila.
    expect(screen.getByTestId("formato1.row_total.1")).toHaveTextContent("0");
  });

  it("flags an empty required cell as invalid", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const target = cell("formato1.cell.1.viernes");
    await user.clear(target);

    expect(target).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Requerido");
  });

  it("totals the management indicators per row", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(cell("formato1.indicator.seguimientocausa.viernes"));
    await user.type(cell("formato1.indicator.seguimientocausa.viernes"), "2");
    await user.clear(cell("formato1.indicator.seguimientocausa.jueves"));
    await user.type(cell("formato1.indicator.seguimientocausa.jueves"), "3");

    expect(
      screen.getByTestId("formato1.indicator_total.seguimientocausa"),
    ).toHaveTextContent("5");
  });

  it("renders one numeric input per trámite and day", () => {
    render(<Harness />);
    const table = screen.getByTestId("formato1.table");
    const inputs = within(table).getAllByRole("textbox");
    // 2 trámites × 7 días + 3 indicadores × 7 días.
    expect(inputs).toHaveLength(2 * 7 + 3 * 7);
  });
});
