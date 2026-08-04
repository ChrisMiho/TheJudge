import type { ReactNode } from "react";

export type DestinationId = string;

/**
 * A menu entry that mounts a view. `kind` is optional so that the many existing
 * destination literals stay valid unannotated; it defaults to "destination"
 * semantically, and the registry states it explicitly.
 */
export interface PortalDestination {
  kind?: "destination";
  id: DestinationId;
  label: string;
  render: (isActive: boolean) => ReactNode;
}

/**
 * A menu entry that runs a handler instead of switching the active destination
 * (DEC-104). Selecting it closes the menu and leaves `activeDestinationId` alone.
 */
export interface PortalActionEntry {
  kind: "action";
  id: DestinationId;
  label: string;
  onSelect: () => void;
}

export type PortalEntry = PortalDestination | PortalActionEntry;

export function isPortalActionEntry(entry: PortalEntry): entry is PortalActionEntry {
  return entry.kind === "action";
}
