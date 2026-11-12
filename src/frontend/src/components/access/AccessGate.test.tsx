import { setIdentityForTest } from "@/__tests__/setup";
import { renderWithActor } from "@/__tests__/test-utils";
import { AccessRequestStatus, type AccessSummary } from "@/backend";
import { AccessGate } from "@/components/access/AccessGate";
import type { InternetIdentityContext } from "@caffeineai/core-infrastructure";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type Identity = NonNullable<InternetIdentityContext["identity"]>;

function fakeIdentity(principal: string): Identity {
  return {
    getPrincipal: () => ({
      isAnonymous: () => false,
      toText: () => principal,
    }),
  } as unknown as Identity;
}

function summary(overrides: Partial<AccessSummary>): AccessSummary {
  return {
    status: AccessRequestStatus.pending,
    isApproved: false,
    isAdmin: false,
    ...overrides,
  };
}

describe("AccessGate", () => {
  it("shows the sign-in panel when there is no session", () => {
    setIdentityForTest();
    renderWithActor(<AccessGate>contenido privado</AccessGate>, {
      getAccessSummary: vi.fn(),
    });

    expect(screen.getByTestId("access.signin_panel")).toBeInTheDocument();
    expect(screen.getByTestId("auth.button")).toBeInTheDocument();
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("blocks an unapproved user and shows the pending panel", async () => {
    setIdentityForTest({ identity: fakeIdentity("aaaaa-aa") });
    renderWithActor(<AccessGate>contenido privado</AccessGate>, {
      getAccessSummary: vi.fn(async () => summary({})),
    });

    await waitFor(() =>
      expect(screen.getByTestId("access.pending_panel")).toBeInTheDocument(),
    );
    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });

  it("renders the children once the user is approved", async () => {
    setIdentityForTest({ identity: fakeIdentity("aaaaa-aa") });
    renderWithActor(<AccessGate>contenido privado</AccessGate>, {
      getAccessSummary: vi.fn(async () =>
        summary({ status: AccessRequestStatus.approved, isApproved: true }),
      ),
    });

    await waitFor(() =>
      expect(screen.getByText("contenido privado")).toBeInTheDocument(),
    );
  });

  it("shows the rejected panel for a rejected request", async () => {
    setIdentityForTest({ identity: fakeIdentity("aaaaa-aa") });
    renderWithActor(<AccessGate>contenido privado</AccessGate>, {
      getAccessSummary: vi.fn(async () =>
        summary({ status: AccessRequestStatus.rejected }),
      ),
    });

    await waitFor(() =>
      expect(screen.getByTestId("access.rejected_panel")).toBeInTheDocument(),
    );
  });
});
