# DESIGN-BRIEF — ask-ai-wait-animation

## Scope

Replace the decrypt submit form with an animated waiting panel while `isSubmitting` is true. Card list and wizard context above the form remain visible. No backend, API, or data contract changes.

## Decisions

| Decision | Value |
|----------|-------|
| Layout during wait | Replace submit form; keep card list / wizard visible above |
| Tone | MTG-flavored + gentle tech humor |
| Motion | CSS keyframe animations only; no animation libraries |
| Timer | Live elapsed-time counter from submission start |
| Message escalation | Threshold-based (0s, 3s, 8s, 15s, 25s, 40s) |
| NFR-006 carve-out | CSS keyframes explicitly permitted for functional wait states |

## Threshold messages (approved copy)

| Threshold | Message |
|-----------|---------|
| 0s | Consulting the stack… |
| 3s | Priority is passing to the LLM. |
| 8s | The judge is reading every layer. Twice. |
| 15s | Still waiting? The servers are scrying 1. |
| 25s | At this point we're basically in a MUD subgame. |
| 40s | If this were F6, we'd have resolved by now. |

## Non-goals

- Backend streaming or progressive answer display
- Animation libraries, sound, or haptics
- API or provider contract changes
- Full-page overlays that hide card context

## PRD references

- REQ-012: Decrypt Stack submit action (dependency)
- REQ-023: Decrypt wait feedback panel (new)
- NFR-002: Fast interaction loop (3-second normal latency target)
- NFR-006: Minimal animation complexity (CSS-only carve-out added)
