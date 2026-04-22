import cors from "cors";
import express from "express";
import { buildMockAnswer } from "./mockAskAi.js";
import { askAiRequestSchema } from "./validation.js";
import type { AskAiError, AskAiRequest } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const retryAfterSeconds = 13;

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

  const payload: AskAiRequest = {
    question: parsed.data.question.trim().length > 0 ? parsed.data.question.trim() : "Resolve the stack",
    stack: parsed.data.stack
  };

  const shouldFail = req.query.fail === "true";
  if (shouldFail) {
    const error: AskAiError = {
      error: "Miho is working on it",
      retryAfterSeconds
    };
    res.status(502).json(error);
    return;
  }

  const response = buildMockAnswer(payload);
  res.status(200).json(response);
});

app.listen(port, () => {
  console.log(`TheJudge backend listening on :${port}`);
});
