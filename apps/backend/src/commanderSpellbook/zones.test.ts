import { describe, expect, it } from "vitest";
import type { ZoneId } from "../types/index.js";
import { COMBO_ZONE_TO_ZONE_ID, ZONE_ID_TO_COMBO_ZONE, sortComboZones, toComboZone } from "./zones.js";

describe("Backend - Ask AI", () => {
  describe("Zone mapping", () => {
    it("maps the six non-stack zones one to one", () => {
      expect(toComboZone("hand")).toBe("H");
      expect(toComboZone("battlefield")).toBe("B");
      expect(toComboZone("command")).toBe("C");
      expect(toComboZone("exile")).toBe("E");
      expect(toComboZone("graveyard")).toBe("G");
      expect(toComboZone("library")).toBe("L");
    });

    it("has no Commander Spellbook equivalent for the stack", () => {
      expect(toComboZone("stack")).toBeNull();
    });

    it("round-trips every mapped zone", () => {
      for (const [zoneId, comboZone] of Object.entries(ZONE_ID_TO_COMBO_ZONE)) {
        expect(COMBO_ZONE_TO_ZONE_ID[comboZone]).toBe(zoneId as ZoneId);
      }
    });

    it("sorts zones into the canonical upstream order", () => {
      expect(sortComboZones(["G", "B", "H"])).toEqual(["H", "B", "G"]);
      expect(sortComboZones(["L", "E", "C"])).toEqual(["C", "E", "L"]);
    });
  });
});
