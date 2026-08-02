# Compact Theme Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five full-width named palette rows with one compact row of five accessible circular color controls.

**Architecture:** Keep `ThemeSection`'s props, palette source, selection callback, and density controls unchanged. Change only its palette markup to a semantic five-column group, then strengthen the standalone component tests around visible compactness, accessibility, and selected state.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Testing Library

**Commit policy:** Do not commit. The active TheJudge work package requires explicit user authorization before any commit.

---

### Task 1: Compact palette controls

**Files:**
- Modify: `apps/frontend/src/components/portal/ThemeSection.test.tsx`
- Modify: `apps/frontend/src/components/portal/ThemeSection.tsx`
- Modify status only: `PRD/work/mobile-view/slice-a-theme-in-menu.md`
- Modify status only: `PRD/work/mobile-view/README.md`

- [x] **Step 1: Reopen slice A before code edits**

Change slice A's status from `done` to `in-progress` in both its slice document and the README slice table. Do not change slice B.

- [x] **Step 2: Write the failing compact-layout test**

Update the React Testing Library import and add this test to `ThemeSection.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";

it("renders the palettes as one compact row of circular controls without visible names", () => {
  renderThemeSection();

  const paletteGroup = screen.getByRole("group", { name: "Theme palettes" });
  expect(paletteGroup).toHaveClass("grid-cols-5", "gap-0.5");

  for (const palette of PALETTES) {
    const paletteButton = within(paletteGroup).getByRole("button", { name: `Theme: ${palette.name}` });
    expect(paletteButton).toHaveClass("h-10", "w-10", "rounded-full", "motion-focus");
    expect(paletteButton).toHaveAttribute("title", palette.name);
    expect(screen.queryByText(palette.name)).not.toBeInTheDocument();
  }
});
```

- [x] **Step 3: Strengthen the selected-state test**

Extend the existing `indicates the active palette` test with visible indicator assertions:

```tsx
const violetButton = screen.getByRole("button", { name: "Theme: Violet" });
const blueButton = screen.getByRole("button", { name: "Theme: Blue" });

expect(violetButton).toHaveAttribute("aria-pressed", "true");
expect(blueButton).toHaveAttribute("aria-pressed", "false");
expect(within(violetButton).getByText("✓")).toBeInTheDocument();
expect(within(blueButton).queryByText("✓")).not.toBeInTheDocument();
```

- [x] **Step 4: Run the focused test to verify RED**

Run:

```bash
npm --workspace apps/frontend run test -- ThemeSection
```

Expected: FAIL because the current component has no `Theme palettes` group and still renders visible palette names.

- [x] **Step 5: Implement the five-circle row**

Replace only the palette-map block in `ThemeSection.tsx` with:

```tsx
<div role="group" aria-label="Theme palettes" className="grid grid-cols-5 gap-0.5">
  {PALETTES.map((palette) => {
    const isActive = palette.id === paletteId;
    return (
      <button
        key={palette.id}
        type="button"
        aria-label={`Theme: ${palette.name}`}
        aria-pressed={isActive}
        title={palette.name}
        onClick={() => onSelect(palette.id)}
        className="motion-hover motion-press motion-focus grid h-10 w-10 place-items-center justify-self-center rounded-full transition"
      >
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-black text-white shadow-sm ${
            isActive ? "border-white ring-2 ring-accent-soft" : "border-white/40"
          }`}
          style={{ backgroundColor: palette.swatch }}
        >
          {isActive ? "✓" : ""}
        </span>
      </button>
    );
  })}
</div>
```

Leave the Layout divider and `DENSITY_OPTIONS` rendering unchanged.

- [x] **Step 6: Run the focused test to verify GREEN**

Run:

```bash
npm --workspace apps/frontend run test -- ThemeSection
```

Expected: all `ThemeSection` tests pass.

- [x] **Step 7: Run slice A's focused integration verification**

Run:

```bash
npm --workspace apps/frontend run test -- ThemeSection FeaturePortalMenu App
npm --workspace apps/frontend run typecheck
```

Expected: all matched tests pass and TypeScript exits with code 0. Palette selection must still close the Menu and persist through the existing App hooks.

- [x] **Step 8: Run the work-package quality gate**

Run:

```bash
npm run quality:check
```

Expected: frontend/backend typecheck, lint, format check, and coverage suites all pass.

- [x] **Step 9: Close the revision and review the final diff**

Set slice A and its README table row back to `done`. Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the approved compact-picker revision, prior slice A/B work, and planning artifacts remain uncommitted.
