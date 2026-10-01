import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerPill } from "./ComposerPill";

afterEach(cleanup);

describe("Frontend - ComposerPill (REQ-206, REQ-132, REQ-012, REQ-121)", () => {
  it("has no separate Send Request label — the send control's visible content is icon-only", () => {
    render(
      <ComposerPill
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    expect(screen.queryByText("Send Request")).not.toBeInTheDocument();
    const send = screen.getByTestId("composer-pill-send");
    expect(send).toHaveAccessibleName("Ask TheJudge");
    expect(send.textContent?.trim()).toBe("");
  });

  it("submits on a tap of the send pill", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ComposerPill
        value="Does trample interact with deathtouch?"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    await user.click(screen.getByTestId("composer-pill-send"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits on Enter but not Shift+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ComposerPill
        value="Does trample interact with deathtouch?"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    const textarea = screen.getByRole("textbox", { name: "Magic question" });
    textarea.focus();
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("draws no ring and hides the count at 0 characters", () => {
    render(
      <ComposerPill
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    expect(screen.queryByTestId("composer-pill-count")).not.toBeInTheDocument();
    expect(screen.getByTestId("composer-pill-send").querySelector("circle")).not.toBeInTheDocument();
  });

  it("draws the ring and the count once text is present, brighter in the last 30 characters", () => {
    const { rerender } = render(
      <ComposerPill
        value="Does trample interact with deathtouch"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    expect(screen.getByTestId("composer-pill-count")).toHaveTextContent("37/300");
    const circle = screen.getByTestId("composer-pill-send").querySelector("circle");
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveClass("text-accent-soft/40");

    rerender(
      <ComposerPill
        value={"x".repeat(280)}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    expect(screen.getByTestId("composer-pill-send").querySelector("circle")).toHaveClass("text-accent-soft");
  });

  it("hides the Add in-depth details segment entirely when the callback is omitted", () => {
    render(
      <ComposerPill
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    expect(screen.queryByTestId("composer-pill-in-depth")).not.toBeInTheDocument();
  });

  it("shows the Add in-depth details pill and calls its handler on click", async () => {
    const user = userEvent.setup();
    const onAddInDepthDetails = vi.fn();
    render(
      <ComposerPill
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
        onAddInDepthDetails={onAddInDepthDetails}
      />
    );

    const pill = screen.getByTestId("composer-pill-in-depth");
    expect(pill).toHaveAccessibleName("Add in-depth details");
    await user.click(pill);
    expect(onAddInDepthDetails).toHaveBeenCalledTimes(1);
  });
});
