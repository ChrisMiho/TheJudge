import { createContext, useContext } from "react";

export const SheetCloseContext = createContext<(() => void) | null>(null);

/** The close handler of the sheet this component renders inside, or `null` outside a sheet — so a foot
 * bar written by a sheet's body (Life Tracker's Done) can close it without the host passing it down. */
export function useSheetClose(): (() => void) | null {
  return useContext(SheetCloseContext);
}
