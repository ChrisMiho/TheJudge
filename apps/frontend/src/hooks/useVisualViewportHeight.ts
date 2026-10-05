import { useEffect, useState } from "react";

/**
 * REQ-218: the height of the part of the page the player can actually see. On a phone the
 * on-screen keyboard shrinks the visual viewport but not the layout viewport (`100dvh`), so a
 * frame sized in `dvh` would sit behind the keyboard. Returns `null` when `visualViewport` is
 * unavailable (jsdom, older browsers) so callers fall back to `100dvh`.
 */
export function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(() =>
    typeof window !== "undefined" && window.visualViewport ? Math.round(window.visualViewport.height) : null
  );

  useEffect(() => {
    const viewport = typeof window !== "undefined" ? window.visualViewport : null;
    if (!viewport) {
      return undefined;
    }
    const update = (): void => setHeight(Math.round(viewport.height));
    update();
    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, []);

  return height;
}
