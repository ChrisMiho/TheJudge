import { useEffect, useRef } from "react";
import { usePortalSlot } from "../../lib/portal/slotContext";

/**
 * Marks the outer app shell's own box (`.page-card` on standard destinations,
 * the full-bleed shell on Life Tracker) as the clipping/sizing anchor for the
 * open feature-portal Menu drawer (REQ-113). Rendered once per `PageShell`,
 * registers its own DOM node into `PortalSlotContext` on mount and
 * unregisters on unmount — the same imperative pattern `PortalSlot` already
 * uses for the corner rail, since `FeaturePortalMenu` is a tree ancestor of
 * `PageShell`/`ShellBounds` and so the child must report its node upward
 * rather than read a value downward.
 *
 * Carries no visible content of its own: `.portal-shell-bounds` (index.css)
 * is an absolutely-positioned, zero-size-impact clip box (`inset: 0`) that
 * FeaturePortalMenu portals the drawer into when one is registered and
 * visible. `pointer-events: none` on the box itself keeps it from
 * intercepting clicks on real shell content around/behind it; the portaled
 * drawer re-enables `pointer-events: auto` for itself.
 */
export function ShellBounds(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { registerShellBounds, unregisterShellBounds } = usePortalSlot();

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    registerShellBounds(node);
    return () => unregisterShellBounds(node);
  }, [registerShellBounds, unregisterShellBounds]);

  return <div ref={ref} className="portal-shell-bounds" />;
}
