import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("lists the trámite catalog and management indicators", async () => {
  const tramites = await actor.listTramites();
  expect(tramites.length).toBeGreaterThanOrEqual(35);
  expect(tramites[0]).toMatchObject({ code: expect.any(String) });

  const indicators = await actor.listIndicators();
  expect(indicators).toHaveLength(3);
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listWeeks()).resolves.toEqual([]);
  await expect(actor.getWeek(0n)).resolves.toEqual([]);
  await expect(actor.getWeekTotals(0n)).resolves.toEqual([]);
  await expect(actor.getWeekAlerts(0n)).resolves.toEqual([]);
});

it("round-trips a week through the real canister and computes totals", async () => {
  const alice = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    (await import("@dfinity/pic")).createIdentity("alice"),
  );

  const record = await alice.createWeek({
    startDate: "2026-09-11",
    tramiteCounts: [
      { tramiteId: 1n, day: { viernes: null }, count: 3n },
      { tramiteId: 1n, day: { lunes: null }, count: 4n },
      { tramiteId: 2n, day: { viernes: null }, count: 5n },
    ],
    indicatorCounts: [
      { indicator: { seguimientoCausa: null }, day: { viernes: null }, count: 2n },
    ],
    demographics: [
      {
        day: { viernes: null },
        ageRange: { nino0a5: null },
        gender: { femenino: null },
        count: 2n,
      },
      {
        day: { viernes: null },
        ageRange: { nino0a5: null },
        gender: { masculino: null },
        count: 3n,
      },
    ],
  });

  expect(record.startDate).toBe("2026-09-11");

  const totals = await alice.getWeekTotals(record.id);
  expect(totals).not.toEqual([]);
  const value = totals[0];
  expect(value.totalTramites).toBe(12n);
  expect(value.totalDemografico).toBe(5n);
  // El viernes tiene 8 trámites y 5 personas: discrepancia.
  expect(value.hasDiscrepancy).toBe(true);

  // Viernes (8 vs 5) y lunes (4 vs 0) difieren: dos alertas de auditoría.
  const alerts = await alice.getWeekAlerts(record.id);
  expect(alerts).toHaveLength(2);
  expect(alerts).toContainEqual({
    day: { viernes: null },
    format1Total: 8n,
    format2Total: 5n,
  });
  expect(alerts).toContainEqual({
    day: { lunes: null },
    format1Total: 4n,
    format2Total: 0n,
  });
});

it("rejects an unapproved caller from writing", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(
    guest.createWeek({
      startDate: "2026-09-11",
      tramiteCounts: [],
      indicatorCounts: [],
      demographics: [],
    }),
  ).rejects.toThrow();
});

it("does not show one caller's week to another", async () => {
  const { createIdentity } = await import("@dfinity/pic");
  const alice = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    createIdentity("alice"),
  );
  const bob = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    createIdentity("bob"),
  );

  const record = await alice.createWeek({
    startDate: "2026-10-02",
    tramiteCounts: [{ tramiteId: 1n, day: { viernes: null }, count: 1n }],
    indicatorCounts: [],
    demographics: [],
  });

  expect(await bob.getWeek(record.id)).toEqual([]);
  expect(await alice.getWeek(record.id)).not.toEqual([]);
});
