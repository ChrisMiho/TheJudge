import cors from "cors";
import express from "express";
import { mockAskAiProvider } from "./providers/mockAskAiProvider.js";
import type { AskAiProvider } from "./providers/askAiProvider.js";
import { askAiRequestSchema } from "./validation.js";
import type { AskAiError } from "./types.js";

const retryAfterSeconds = 13;

type AppOptions = {
  frontendOrigin?: string;
  askAiProvider?: AskAiProvider;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const askAiProvider = options.askAiProvider ?? mockAskAiProvider;

  app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/api/ask-ai", async (req, res) => {
    const parsed = askAiRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const error: AskAiError = {
        error: "Invalid request payload",
        retryAfterSeconds
      };
      res.status(400).json(error);
      return;
    }

    const shouldFail = req.query.fail === "true";
    if (shouldFail) {
      const error: AskAiError = {
        error: "Miho is working on it",
        retryAfterSeconds
      };
      res.status(502).json(error);
      return;
    }

    try {
      const response = await askAiProvider.generateAnswer(parsed.data);
      res.status(200).json(response);
    } catch {
      const error: AskAiError = {
        error: "Miho is working on it",
        retryAfterSeconds
      };
      res.status(502).json(error);
    }
  });

  return app;
}
