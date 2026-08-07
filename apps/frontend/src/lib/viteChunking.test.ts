// @vitest-environment node

import { describe, expect, it } from "vitest";
import viteConfig from "../../vite.config";

function getManualChunkName(id: string): string | undefined {
  const output = viteConfig.build?.rollupOptions?.output;
  if (!output || Array.isArray(output) || typeof output.manualChunks !== "function") {
    throw new Error("Vite must configure manualChunks in function form");
  }
  return (output.manualChunks as (moduleId: string) => string | undefined)(id);
}

describe("Frontend - Shared", () => {
  describe("Vite chunk ownership", () => {
    it.each([
      "/repo/node_modules/react/index.js",
      "/repo/node_modules/react/jsx-runtime.js",
      "/repo/node_modules/react-dom/client.js",
      "/repo/node_modules/react-router/dist/development/index.mjs"
    ])("groups framework module %s in vendor", (moduleId) => {
      expect(getManualChunkName(moduleId)).toBe("vendor");
    });

    it.each([
      "/repo/apps/frontend/src/lib/scan/detector.ts",
      "/repo/apps/frontend/src/hooks/useScanCapture.ts",
      "/repo/apps/frontend/src/components/ScanCameraSurface.tsx",
      "/repo/apps/frontend/src/components/ScanCardOutline.tsx",
      "/repo/apps/frontend/src/components/ScanDebugOverlay.tsx"
    ])("groups shared scan module %s in scan", (moduleId) => {
      expect(getManualChunkName(moduleId)).toBe("scan");
    });

    it.each([
      "/repo/apps/frontend/src/components/ZoneCardPicker.tsx",
      "/repo/apps/frontend/src/components/trade/useTradeScan.ts",
      "/repo/apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx"
    ])("leaves destination-owned module %s with its destination", (moduleId) => {
      expect(getManualChunkName(moduleId)).toBeUndefined();
    });
  });
});
