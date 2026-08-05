import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShellBounds } from "./ShellBounds";
import { PortalSlotContext } from "../../lib/portal/slotContext";

afterEach(cleanup);

describe("Frontend - Portal", () => {
describe("ShellBounds", () => {
  it("registers its own node on mount and unregisters the same node on unmount", () => {
    const registerSlot = vi.fn();
    const unregisterSlot = vi.fn();
    const registerShellBounds = vi.fn();
    const unregisterShellBounds = vi.fn();

    const { unmount } = render(
      <PortalSlotContext.Provider
        value={{ registerSlot, unregisterSlot, registerShellBounds, unregisterShellBounds }}
      >
        <ShellBounds />
      </PortalSlotContext.Provider>
    );

    expect(registerShellBounds).toHaveBeenCalledTimes(1);
    const [node] = registerShellBounds.mock.calls[0];
    expect(node).toBeInstanceOf(HTMLDivElement);

    unmount();
    expect(unregisterShellBounds).toHaveBeenCalledWith(node);
  });

  it("renders no visible content of its own beyond the clip-box class", () => {
    const registerShellBounds = vi.fn();
    const unregisterShellBounds = vi.fn();

    const { container } = render(
      <PortalSlotContext.Provider
        value={{
          registerSlot: vi.fn(),
          unregisterSlot: vi.fn(),
          registerShellBounds,
          unregisterShellBounds
        }}
      >
        <ShellBounds />
      </PortalSlotContext.Provider>
    );

    const node = container.querySelector("div.portal-shell-bounds");
    expect(node).toBeInTheDocument();
    expect(node).toBeEmptyDOMElement();
  });

  it("does not crash when rendered outside a provider (isolated tests, no-op default)", () => {
    expect(() => render(<ShellBounds />)).not.toThrow();
  });
});
});
