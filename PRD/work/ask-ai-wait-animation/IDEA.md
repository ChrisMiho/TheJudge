# IDEA — ask-ai-wait-animation

## Problem

When a user submits a decrypt request, the enrichment step offers almost no feedback beyond a disabled button labeled "Decrypting…". Long OpenAI latency feels like a dead screen, which undermines the otherwise polished zone-flow experience.

## Outcome

Replace the decrypt form with a dedicated waiting panel while `isSubmitting` is true: a live elapsed-time display, lightweight CSS animations, and threshold-based messages that mix MTG flavor with gentle tech humor as the wait grows longer.

## Non-goals

- Backend streaming or progressive answer display
- Animation libraries, sound, or haptics
- API or provider contract changes
- Full-page blocking overlays that hide card context above the form
