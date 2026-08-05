# assistant-chat-shell-followup

Handoff from `assistant-chat-shell` (ship-ready, slices A–E done: markdown answers, browser-local history, history drawer, Menu corner-rail History trigger, full-bleed conversation thread). That package is ready for `/thejudge-cleanup` after its PR merges; further live feedback should land here so cleanup is not blocked.

Problem: post-ship review of the chat shell is still surfacing visual and interaction issues against the Claude/ChatGPT-like goal. Early captures are in `issues/` (to be annotated and expanded during refinement). Outcome: a focused follow-up package that absorbs remaining chat-shell polish and regressions without reopening the shipped A–E scope or the cleanup of the original folder.

Non-goals for this capture: no new product decisions or DESIGN-BRIEF yet; no implementation; no changes to Ask AI contracts/providers. Refinement starts after the issue set is complete.
