import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComposerPill } from "./ComposerPill";
import {
  getLastDictationInstance,
  installStubSpeechRecognition,
  makeDictationResultsEvent
} from "../test/stubSpeechRecognition";

afterEach(cleanup);

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const flowCss = readFileSync(resolve(process.cwd(), "src/styles/flow.css"), "utf8");

describe("Frontend - ComposerPill (REQ-206, REQ-132, REQ-012, REQ-121)", () => {
  it("has no separate Send Request label — the send control's visible content is the mockup's ➤ glyph only", () => {
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
    expect(send.textContent?.trim()).toBe("➤");
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

  it("marks the box empty at 0 characters so the count, track and fill are not drawn (flow.css)", () => {
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

    const box = screen.getByTestId("composer-pill");
    expect(box).toHaveAttribute("data-fill", "0");
    expect(flowCss).toMatch(/\.q-box\[data-fill="0"\] \.q-count[^{]*\{[^}]*display: none/);
    expect(flowCss).toMatch(/\.q-box\[data-fill="0"\] \.send-ring \.track[\s\S]*opacity: 0/);
    // the ring is always in the DOM; CSS draws it from the box's --fill
    expect(screen.getByTestId("composer-pill-ring")).toBeInTheDocument();
  });

  it("drives the budget ring from the box's --fill, brighter in the last 30 characters", () => {
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

    const box = screen.getByTestId("composer-pill");
    expect(screen.getByTestId("composer-pill-count")).toHaveTextContent("37 / 300");
    expect(box).toHaveAttribute("data-fill", "some");
    expect(box).toHaveAttribute("data-near", "false");
    expect(box.style.getPropertyValue("--fill")).toBe("12.3");
    expect(screen.getByTestId("composer-pill-ring").querySelector("path.fill")).toBeInTheDocument();

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

    expect(screen.getByTestId("composer-pill")).toHaveAttribute("data-near", "true");
    expect(screen.getByTestId("composer-pill").style.getPropertyValue("--fill")).toBe("93.3");
    expect(screen.getByTestId("composer-pill-count")).toHaveAttribute("data-near", "true");
  });

  it("starts the ring at the top of the mic|send seam and runs it clockwise round the pill (the mockup's path)", () => {
    render(
      <ComposerPill
        value="x"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    const ring = screen.getByTestId("composer-pill-ring");
    expect(ring).toHaveAttribute("viewBox", "0 0 88 48");
    expect(ring.querySelector("path.fill")).toHaveAttribute("d", "M44 4 H64 A20 20 0 0 1 64 44 H24 A20 20 0 0 1 24 4 Z");
  });

  it("is the follow-up box (.followup, .fu-count, no In-depth chip) in the followup variant", () => {
    render(
      <ComposerPill
        variant="followup"
        value="Hi"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onAddInDepthDetails={vi.fn()}
        maxLength={300}
        placeholder="Ask a follow-up…"
        textareaAriaLabel="Follow-up question"
        submitLabel="Send"
        pendingLabel="Send"
      />
    );

    const box = screen.getByTestId("composer-pill");
    expect(box).toHaveClass("followup");
    expect(box).not.toHaveClass("q-box");
    expect(screen.getByTestId("composer-pill-count")).toHaveClass("fu-count");
    expect(screen.queryByTestId("composer-pill-in-depth")).not.toBeInTheDocument();
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

  it("shows no mic control where the browser has no speech recognition (today's arrow alone)", () => {
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

    expect(screen.queryByTestId("dictation-mic")).not.toBeInTheDocument();
  });
});

describe("Frontend - ComposerPill dictation (REQ-212)", () => {
  let uninstall: () => void;

  beforeEach(() => {
    uninstall = installStubSpeechRecognition();
  });

  afterEach(() => {
    uninstall();
  });

  it("shows a mic control and starts listening on tap", async () => {
    const user = userEvent.setup();
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

    const mic = screen.getByTestId("dictation-mic");
    expect(mic).toHaveAccessibleName("Dictate question");

    await user.click(mic);

    expect(getLastDictationInstance().start).toHaveBeenCalledTimes(1);
    expect(mic).toHaveAccessibleName("Stop dictating");
    expect(screen.getByRole("textbox", { name: "Magic question" })).toHaveAttribute(
      "placeholder",
      "Listening…"
    );
  });

  it("inserts recognised text appended to existing text, clipped at the character budget (REQ-011)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ComposerPill
        value="Does"
        onChange={onChange}
        onSubmit={vi.fn()}
        maxLength={10}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    await user.click(screen.getByTestId("dictation-mic"));
    act(() => {
      getLastDictationInstance().onresult!(makeDictationResultsEvent(["trample work"]));
    });

    expect(onChange).toHaveBeenCalledWith("Does tramp");
  });

  it("stops listening on a second mic tap", async () => {
    const user = userEvent.setup();
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

    const mic = screen.getByTestId("dictation-mic");
    await user.click(mic);
    expect(mic).toHaveAttribute("aria-pressed", "true");

    await user.click(mic);
    expect(mic).toHaveAttribute("aria-pressed", "false");
    expect(getLastDictationInstance().stop).toHaveBeenCalledTimes(1);
  });

  it("stops listening when the send pill is tapped mid-dictation, and still submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ComposerPill
        value="hello"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    await user.click(screen.getByTestId("dictation-mic"));
    await user.click(screen.getByTestId("composer-pill-send"));

    expect(getLastDictationInstance().stop).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("surfaces a one-line message on a denied microphone and leaves typed text intact", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ComposerPill
        value="kept text"
        onChange={onChange}
        onSubmit={vi.fn()}
        maxLength={300}
        placeholder="What would you like to know?"
        textareaAriaLabel="Magic question"
        submitLabel="Ask TheJudge"
        pendingLabel="Asking…"
      />
    );

    await user.click(screen.getByTestId("dictation-mic"));
    act(() => {
      getLastDictationInstance().onerror!({ error: "not-allowed" });
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Microphone access was denied.");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("dictation-mic")).toHaveAttribute("aria-pressed", "false");
  });

  it("meets the 44px touch floor on both the mic and send halves (REQ-205)", () => {
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

    // REQ-205 wins over the mockup's 40px: index.css raises the pill, both halves and the chip to 44px.
    expect(appCss).toMatch(/\.send-pair button \{[^}]*width: 44px;[^}]*height: 44px/);
    expect(appCss).toMatch(/\.send-pair \{[^}]*height: 44px/);
    expect(appCss).toMatch(/\.q-box \.deep \{[^}]*height: 44px/);
    expect(screen.getByTestId("dictation-mic")).toHaveClass("mic");
    expect(screen.getByTestId("composer-pill-send")).toHaveClass("send");
  });
});
