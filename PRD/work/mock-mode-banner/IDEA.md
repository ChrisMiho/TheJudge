---
name: mock-mode-banner
description: Show a persistent top-of-screen banner when the app runs in mock AI provider mode
metadata:
  type: project
---

Local development defaults to mock AI provider mode (`ASK_AI_PROVIDER=mock`), but the frontend gives no visible indication — users only discover it when chat answers begin with "MOCK RESPONSE."

Add a fixed banner at the top of every flow step when the app starts in mock mode, so developers immediately know they are not hitting the live OpenAI path.

Outcome: running `npm run dev` / `dev:mock` shows an unmistakable environment indicator on all screens without changing backend behavior or the ask-AI contract.

Non-goals: no backend health-endpoint exposure, no dismissible banner, no changes to mock response content, and no banner in production unless mock mode is explicitly configured at build time.
