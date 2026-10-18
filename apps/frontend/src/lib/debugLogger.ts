import { debugLoggingEnabled } from "./env";
import { randomId } from "./randomId";

type DebugPayload = Record<string, unknown>;

export function createCorrelationId(): string {
  return randomId("corr");
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
