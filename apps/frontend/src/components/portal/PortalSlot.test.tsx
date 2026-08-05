import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalSlot } from "./PortalSlot";
import { PortalSlotContext } from "../../lib/portal/slotContext";

afterEach(cleanup);

describe("Frontend - Portal", () => {
describe("PortalSlot", () => {
  it("registers itself with a getHistoryTrigger getter and unregisters on unmount", () => {
    const registerSlot = vi.fn();
    const unregisterSlot = vi.fn();

    const { unmount } = render(
      <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
        <PortalSlot />
      </PortalSlotContext.Provider>
    );

    expect(registerSlot).toHaveBeenCalledTimes(1);
    const [node, getHistoryTrigger] = registerSlot.mock.calls[0];
    expect(node).toBeInstanceOf(HTMLDivElement);
    expect(getHistoryTrigger()).toBeUndefined();

    unmount();
    expect(unregisterSlot).toHaveBeenCalledWith(node);
  });

  it("exposes the latest historyTrigger through the stable getter without re-registering", () => {
    const registerSlot = vi.fn();
    const unregisterSlot = vi.fn();
    const onOpen = vi.fn();

    const { rerender } = render(
      <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
        <PortalSlot />
      </PortalSlotContext.Provider>
    );

    const getHistoryTrigger = registerSlot.mock.calls[0][1] as () => { onOpen: () => void } | undefined;
    expect(getHistoryTrigger()).toBeUndefined();

    rerender(
      <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
        <PortalSlot historyTrigger={{ onOpen }} />
      </PortalSlotContext.Provider>
    );

    // Same getter identity, no re-registration — only its return value changes.
    expect(registerSlot).toHaveBeenCalledTimes(1);
    expect(getHistoryTrigger()).toEqual({ onOpen });
  });

  it("renders a self-start alignment override for the host header grid", () => {
    const registerSlot = vi.fn();
    const unregisterSlot = vi.fn();

    const { container } = render(
      <PortalSlotContext.Provider value={{ registerSlot, unregisterSlot }}>
        <PortalSlot />
      </PortalSlotContext.Provider>
    );

    expect(container.querySelector("div.self-start")).toBeInTheDocument();
  });
});
});
