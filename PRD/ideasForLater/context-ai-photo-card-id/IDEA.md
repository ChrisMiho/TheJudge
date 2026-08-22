# context-ai-photo-card-id

On-device fingerprint card scanning is unreliable for stack and board state collection during live play: glare, casual lighting, and hand-held capture make lock-in hard even when the card is clearly visible in a photo. Collection scanning under a stand with controlled conditions has worked well, so the fingerprint path is still the right tool when inventorying many cards offline.

Outcome: for MTG Assistant context collection (stack and board), replace scan-as-identity with a photo → AI names cards → local metadata extract path that reuses the existing oracle-backed metadata pipeline rather than inventing card text in the model. Keep the existing fingerprint scanner available for collection management, where batch size, cost, and controlled lighting favor on-device matching with no AI vision round-trips.

Non-goals: do not remove or replace fingerprint scan for collection management; do not send bulk collection photos through AI by default; do not replace local oracle extraction with AI-authored rules text.
