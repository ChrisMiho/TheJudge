# IDEA: scan-lock-on-outline

**Problem:** While a user is scanning a card, there is nothing that helps them tell when the camera is close to a confident match, so they can't easily correct the angle to lock the card in.

**Outcome:** When the live scan match confidence crosses a certain threshold, surface the debug outline on the card in the viewfinder as a positive alignment cue — helping the user hold the right angle and complete the match faster.

**Non-goals:** Not changing the underlying fingerprint/matching algorithm or its thresholds for accepting a match; not exposing the full developer debug overlay as a permanent feature; not adding new scan modes.
