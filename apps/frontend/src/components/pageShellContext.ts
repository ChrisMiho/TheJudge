import { createContext } from "react";

/**
 * The header slot a `PageShell` owns: the app header and the mock-mode banner
 * render into it, at the top of the shell and outside the page column's
 * padding (REQ-207), in the mockup's DOM order (header, banner, then the
 * column). `undefined` means no shell is above, so the header renders inline.
 * `null` means the shell's slot node has not mounted yet.
 */
export const PageShellHeaderSlotContext = createContext<HTMLElement | null | undefined>(undefined);
