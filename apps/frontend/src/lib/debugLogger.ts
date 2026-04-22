import { debugLoggingEnabled } from "./env";

type DebugPayload = Record<string, unknown>;

export function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `corr-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function logFrontendDebug(event: string, payload: DebugPayload = {}): void {
  if (!debugLoggingEnabled) {
    return;
  }

  console.info("[TheJudge][frontend]", {
    event,
    timestamp: new Date().toISOString(),
    ...payload
  });
}
