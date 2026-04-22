import cors from "cors";
import express from "express";
import { buildMockAnswer } from "./mockAskAi.js";
import { buildPromptContext } from "./promptContext.js";
import { askAiRequestSchema } from "./validation.js";
import type { AskAiError } from "./types.js";

const retryAfterSeconds = 13;

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/api/ask-ai", (req, res) => {
    const parsed = askAiRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const error: AskAiError = {
        error: "Invalid request payload",
        retryAfterSeconds
      };
      res.status(400).json(error);
      return;
    }

    const promptContext = buildPromptContext(parsed.data);

    const shouldFail = req.query.fail === "true";
    if (shouldFail) {
      const error: AskAiError = {
        error: "Miho is working on it",
        retryAfterSeconds
      };
      res.status(502).json(error);
      return;
    }

    const response = buildMockAnswer(promptContext);
    res.status(200).json(response);
  });

  return app;
}
