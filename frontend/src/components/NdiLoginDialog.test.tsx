import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";

describe("NDI login dialog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ listings: [] }),
        ok: true,
      }),
    );
  });

  it("opens citizen and officer login as a dialog from the public portal", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /citizen login/i })[0]);
    expect(await screen.findByRole("heading", { name: "Login with NDI" })).toBeInTheDocument();
    expect(screen.getByText("Simple NDI login")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Officer" }));
    expect(await screen.findByRole("heading", { name: "Officer NDI Login" })).toBeInTheDocument();
  });
});
