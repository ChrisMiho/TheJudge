---
name: cardomancer-card-detection
description: Optional on-device card scanner that adds cards to a zone by camera, alongside the existing manual search
metadata:
  type: project
---

Adding cards to zones today is typed-only: the user searches a name, previews, and adds.
For live-table setup — especially filling a zone with several cards at once — typing each
name is slow. A friend has exported a proven, self-contained card-identification engine
("Cardomancer") that recognizes a Magic card from a photo of its artwork, fully on-device,
with no network calls, returning a ranked list of candidate cards.

The idea: wire that engine into TheJudge as an **optional, faster input method** that sits
*alongside* manual search — never replacing it. Tap **Scan** on a zone, point the camera,
and the identified card flows into the exact same preview-and-add path a typed search uses
today (same owner selection, duplicate-stack blocking, stack limits, `ZoneCardItem` output).
Scanning becomes a batch tool: scan → accept → the camera re-opens for the next card → exit
when the zone is done.

Outcome: capturing game-state context becomes meaningfully faster and less tedious, lowering
the friction that keeps players from feeding TheJudge a complete board before asking a
question — without adding backend cost, network dependence, or any change to the prompt /
API contract.

Non-goals: not a replacement for manual search; no backend involvement in identification;
no printing disambiguation, grading, pricing, or multi-card-per-frame detection; no runtime
network calls during scanning.
