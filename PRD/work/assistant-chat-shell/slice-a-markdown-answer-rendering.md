# Slice A — Structured markdown answer rendering

## Status: planned

## Goal

Render assistant messages in `ConversationThread` as structured markdown
(headings, lists, emphasis, inline code, tables, code blocks, links) instead
of plain text; user messages stay plain text. Client-side only, no wire
contract change.

## Requirements

1. Add `react-markdown` and `remark-gfm` to `apps/frontend/package.json`. Do
   **not** add `rehype-raw` — without it, `react-markdown` never renders raw
   HTML found in the source string as live DOM, which satisfies "no
   script/style injection execution" without a separate sanitizer dependency.
2. In `ConversationThread.tsx`, replace the plain-text render at the message
   body (currently `<p className="whitespace-pre-wrap">{message.content}</p>`,
   around line 143) with a conditional: `role === "assistant"` renders
   `<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>`
   inside a wrapper (e.g. `className="conversation-markdown"`); `role === "user"`
   keeps the existing `<p className="whitespace-pre-wrap">` untouched.
3. Style headings, lists, emphasis, inline code, code blocks, tables, and
   links inside `.conversation-markdown` using existing neutral/theme-token
   classes already used elsewhere in the bubble (do not hardcode colors that
   would break under a different palette — this suite uses a CSS custom
   property palette system per `applyPalette.ts`).
4. Add CSS so long code blocks and tables scroll horizontally inside their
   own container rather than overflowing the page:
   `.conversation-markdown pre`, `.conversation-markdown table` (wrapped in a
   scroll container) get `overflow-x: auto` in `index.css`.
5. Supply a custom `a` renderer via `ReactMarkdown`'s `components` prop that
   adds `target="_blank" rel="noopener noreferrer"` to every link.
6. Plain-text answers containing no markdown syntax must render with the same
   visible text as today (react-markdown renders a bare string as one
   paragraph of that text — verify this holds for representative existing
   mock answers).

## Acceptance criteria

- [ ] Assistant messages render markdown headings, ordered/unordered lists,
      bold/italic emphasis, inline code, fenced code blocks, tables, and
      links with legible styling in both light and dark theme profiles.
- [ ] User messages render as plain text; markdown syntax in a user message
      (e.g. `**not bold**`) is never parsed.
- [ ] A plain-text answer with no markdown syntax displays unchanged from
      today's rendering.
- [ ] An assistant message containing `<script>...</script>` or similar raw
      HTML renders as literal text; no injected element executes or appears
      in the DOM as a real `<script>`/`<style>` node.
- [ ] Long code blocks and tables scroll horizontally within their own
      container; the page itself does not gain horizontal scroll.
- [ ] Links render with `target="_blank"` and `rel="noopener noreferrer"`.
- [ ] Rendering logic lives in one place (`ConversationThread.tsx`) and
      applies identically to both In-Depth Question and Quick Question — no
      per-flow duplication.
- [ ] No change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas, or
      provider behavior.

## Verification

```bash
cd apps/frontend && npx vitest run src/components/ConversationThread.test.tsx
cd apps/frontend && npm run quality:check
```

Manual check (`npm run dev` in `apps/frontend`): trigger an answer containing
headings/lists/a table/a code block/a link in both the In-Depth Question and
Quick Question destinations; confirm rendering and horizontal-scroll behavior
in both light and dark theme profiles.

## Files touched

- `apps/frontend/package.json`
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/ConversationThread.test.tsx`
- `apps/frontend/src/index.css`
