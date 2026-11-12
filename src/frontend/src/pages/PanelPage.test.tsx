import { renderWithActor } from "@/__tests__/test-utils";
import {
  AgeRange,
  type AuditAlert,
  type Tramite,
  TramiteCategory,
  WeekDay,
  type WeekSummary,
  type WeekTotals,
} from "@/backend";
import { useWeekStore } from "@/hooks/useWeekStore";
import PanelPage from "@/pages/PanelPage";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// recharts' ResponsiveContainer observa el tamaño del contenedor; jsdom no lo trae.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

const WEEK_START = "2026-09-11";

beforeEach(() => {
  useWeekStore.setState({ weekStart: WEEK_START, activeDay: "" });
});

const WEEKS: WeekSummary[] = [
  {
    id: 1n,
    startDate: WEEK_START,
    totalTramites: 12n,
    totalUsuarios: 12n,
    hasDiscrepancy: true,
    updatedAt: 0n,
  },
];

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

const TOTALS: WeekTotals = {
  totalTramites: 12n,
  totalUsuarios: 12n,
  totalDemografico: 5n,
  perDayTramites: [
    [WeekDay.viernes, 8n],
    [WeekDay.lunes, 4n],
  ],
  perDayUsuarios: [
    [WeekDay.viernes, 5n],
    [WeekDay.lunes, 4n],
  ],
  perTramite: [
    [1n, 7n],
    [2n, 5n],
  ],
  perAgeRange: [
    [AgeRange.nino0a5, 3n],
    [AgeRange.adulto18mas, 2n],
  ],
  hasDiscrepancy: true,
};

const ALERTS: AuditAlert[] = [
  { day: WeekDay.viernes, format1Total: 8n, format2Total: 5n },
];

function makeActor(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    listWeeks: vi.fn(async () => structuredClone(WEEKS)),
    listTramites: vi.fn(async () => structuredClone(TRAMITES)),
    getWeekTotals: vi.fn(async () => structuredClone(TOTALS)),
    getWeekAlerts: vi.fn(async () => structuredClone(ALERTS)),
    ...overrides,
  };
}

describe("PanelPage", () => {
  it("shows the weekly KPIs, ranking and audit alerts from the backend", async () => {
    const actor = makeActor();
    renderWithActor(<PanelPage />, actor);

    await waitFor(() =>
      expect(screen.getByTestId("panel.kpi_card.usuarios")).toHaveTextContent(
        "12",
      ),
    );
    expect(screen.getByTestId("panel.kpi_card.tramites")).toHaveTextContent(
      "12",
    );
    // Una alerta de auditoría => una brecha de validación.
    expect(screen.getByTestId("panel.kpi_card.brechas")).toHaveTextContent("1");

    // Ranking: el trámite con mayor movimiento aparece primero con su porcentaje.
    const ranking = screen.getByTestId("panel.ranking_list");
    expect(ranking).toHaveTextContent("Apertura de causa por solicitud");
    expect(ranking).toHaveTextContent("58,3%");

    // Alerta de auditoría con ambos totales.
    const alert = screen.getByTestId("panel.alert_item.1");
    expect(alert).toHaveTextContent("Viernes");
    expect(alert).toHaveTextContent("Formato 1: 8");
    expect(alert).toHaveTextContent("Formato 2: 5");
  });

  it("shows the empty state when the active week has no record", async () => {
    const actor = makeActor({ listWeeks: vi.fn(async () => []) });
    renderWithActor(<PanelPage />, actor);

    await waitFor(() =>
      expect(screen.getByTestId("panel.empty_state")).toBeInTheDocument(),
    );
  });

  it("shows the no-alerts state when there are no discrepancies", async () => {
    const actor = makeActor({ getWeekAlerts: vi.fn(async () => []) });
    renderWithActor(<PanelPage />, actor);

    await waitFor(() =>
      expect(
        screen.getByTestId("panel.alerts_empty_state"),
      ).toBeInTheDocument(),
    );
  });
});
