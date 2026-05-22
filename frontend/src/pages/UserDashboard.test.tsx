import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserDashboard from "@/pages/UserDashboard";
import { clearSessionUser, getSessionUser, setSessionUser, type SessionUser } from "@/lib/auth";

const wallet = "0x1111111111111111111111111111111111111111";

const sessionUser: SessionUser = {
  role: "user",
  holderDid: "did:key:test-citizen",
  idNumberDisplay: "CID-001",
  sessionToken: "spp_test_session",
  walletAddress: wallet,
  wallet,
  displayName: "Test Citizen",
};

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/user-dashboard"]}>
      <Routes>
        <Route path="/" element={<div>Public portal</div>} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </MemoryRouter>,
  );

describe("UserDashboard logout", () => {
  beforeEach(() => {
    clearSessionUser();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/listings")) {
          return { json: async () => ({ listings: [] }), ok: true };
        }
        if (url.includes("/api/portfolio/")) {
          return { json: async () => ({ holdings: [], leases: [] }), ok: true };
        }
        if (url.includes("/api/auth/logout")) {
          return { json: async () => ({ ok: true }), ok: true };
        }
        return { json: async () => ({}), ok: true };
      }),
    );
  });

  it("invalidates the API session and returns to the public portal", async () => {
    setSessionUser(sessionUser);

    renderDashboard();

    fireEvent.click(await screen.findByRole("button", { name: /logout/i }));

    await waitFor(() => expect(screen.getByText("Public portal")).toBeInTheDocument());
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" })));
    expect(getSessionUser()).toBeNull();
  });

  it("redirects unauthenticated dashboard visits to the public portal", async () => {
    renderDashboard();

    await waitFor(() => expect(screen.getByText("Public portal")).toBeInTheDocument());
  });
});
