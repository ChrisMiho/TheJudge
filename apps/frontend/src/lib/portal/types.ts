import type { ReactNode } from "react";

export type DestinationId = string;

export interface PortalDestination {
  id: DestinationId;
  label: string;
  render: (isActive: boolean) => ReactNode;
}
