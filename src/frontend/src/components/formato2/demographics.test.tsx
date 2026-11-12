import { AgeRange, Gender, WeekDay } from "@/backend";
import { DemographicGrid } from "@/components/formato2/DemographicGrid";
import { DiscrepancyAlert } from "@/components/formato2/DiscrepancyAlert";
import {
  type DemographicDraft,
  ageRangeSubtotal,
  cellKey,
  dayTotal,
  emptyDraft,
  genderSubtotal,
  isDraftComplete,
  weekTotal,
} from "@/components/formato2/demographics";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function draftWith(entries: Array<[WeekDay, AgeRange, Gender, string]>) {
  const draft = emptyDraft();
  for (const [day, ageRange, gender, value] of entries) {
    draft[cellKey(day, ageRange, gender)] = value;
  }
  return draft;
}

function GridHarness({
  initial,
  format1Total,
}: {
  initial: DemographicDraft;
  format1Total: number | null;
}) {
  const [draft, setDraft] = useState<DemographicDraft>(initial);
  return (
    <DemographicGrid
      day={WeekDay.viernes}
      draft={draft}
      format1Total={format1Total}
      onCellChange={(key, value) =>
        setDraft((current) => ({ ...current, [key]: value }))
      }
    />
  );
}

describe("demographics totals", () => {
  it("computes age-range, gender and day subtotals", () => {
    const draft = draftWith([
      [WeekDay.viernes, AgeRange.nino0a5, Gender.femenino, "2"],
      [WeekDay.viernes, AgeRange.nino0a5, Gender.masculino, "3"],
      [WeekDay.viernes, AgeRange.adulto18mas, Gender.femenino, "4"],
    ]);

    expect(ageRangeSubtotal(draft, WeekDay.viernes, AgeRange.nino0a5)).toBe(5);
    expect(genderSubtotal(draft, WeekDay.viernes, Gender.femenino)).toBe(6);
    expect(genderSubtotal(draft, WeekDay.viernes, Gender.masculino)).toBe(3);
    expect(dayTotal(draft, WeekDay.viernes)).toBe(9);
    expect(weekTotal(draft)).toBe(9);
  });

  it("treats empty and invalid cells as zero and reports incompleteness", () => {
    const draft = draftWith([
      [WeekDay.viernes, AgeRange.nino0a5, Gender.femenino, ""],
      [WeekDay.viernes, AgeRange.nino0a5, Gender.masculino, "-1"],
    ]);
    expect(dayTotal(draft, WeekDay.viernes)).toBe(0);
    expect(isDraftComplete(draft)).toBe(false);
  });
});

describe("DemographicGrid", () => {
  it("shows the day total and a discrepancy note when it differs from Formato 1", () => {
    const draft = draftWith([
      [WeekDay.viernes, AgeRange.nino0a5, Gender.femenino, "2"],
      [WeekDay.viernes, AgeRange.nino0a5, Gender.masculino, "3"],
    ]);
    render(<GridHarness initial={draft} format1Total={9} />);

    expect(screen.getByTestId("formato2.day_total")).toHaveTextContent("5");
    expect(
      screen.getByTestId("formato2.day_discrepancy_note"),
    ).toHaveTextContent("difiere del Formato 1 (9)");
  });

  it("omits the discrepancy note when the day total matches Formato 1", () => {
    const draft = draftWith([
      [WeekDay.viernes, AgeRange.nino0a5, Gender.femenino, "2"],
      [WeekDay.viernes, AgeRange.nino0a5, Gender.masculino, "3"],
    ]);
    render(<GridHarness initial={draft} format1Total={5} />);

    expect(screen.getByTestId("formato2.day_total")).toHaveTextContent("5");
    expect(
      screen.queryByTestId("formato2.day_discrepancy_note"),
    ).not.toBeInTheDocument();
  });

  it("recomputes the day total as the user types", async () => {
    const user = userEvent.setup();
    render(<GridHarness initial={emptyDraft()} format1Total={null} />);

    await user.type(screen.getByTestId("formato2.input.1.femenino"), "4");
    await user.type(screen.getByTestId("formato2.input.1.masculino"), "6");

    expect(screen.getByTestId("formato2.day_total")).toHaveTextContent("10");
  });
});

describe("DiscrepancyAlert", () => {
  it("lists each discrepant day with both values and the difference", () => {
    render(
      <DiscrepancyAlert
        discrepancies={[
          { day: WeekDay.viernes, format1Total: 9, format2Total: 5 },
        ]}
      />,
    );

    const item = screen.getByTestId("formato2.crosscheck.item.viernes");
    expect(item).toHaveTextContent("Viernes");
    expect(item).toHaveTextContent("Formato 2: 5");
    expect(item).toHaveTextContent("Formato 1: 9");
    expect(item).toHaveTextContent("Diferencia: -4");
  });

  it("confirms consistency when there are no discrepancies", () => {
    render(<DiscrepancyAlert discrepancies={[]} />);
    expect(
      screen.getByTestId("formato2.crosscheck.success_state"),
    ).toHaveTextContent("Totales consistentes con el Formato 1");
  });
});
