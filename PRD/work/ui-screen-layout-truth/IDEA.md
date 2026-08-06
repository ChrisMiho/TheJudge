# IDEA: UI screen layout product truth

Agents refining UI from short bug/feedback descriptions often overcalibrate layout — e.g. “stretch to fill space” becomes full-bleed across the viewport. The product needs durable PRD truth that describes major screens, what each is for, and intended general sizes/containment for desktop and mobile, so agents can refine toward a shared direction instead of guessing.

**Outcome:** A lean product-truth surface (likely under `PRD/sections/`, possibly extending or complementing `ui-presentation` / system-map) that agents read before UI polish work: screen inventory, purpose, and coarse layout/size guidance per breakpoint — enough to avoid over-stretching and under-constraining without becoming a pixel-perfect design system.

**Non-goals:** Not a full design system, Figma parity, or token library; not rewriting every existing UI in one pass; not replacing feature-specific DECs — only the shared layout/direction layer agents currently lack.
