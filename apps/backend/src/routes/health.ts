import type { Express } from "express";

export function registerHealthRoute(app: Express): void {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
}
