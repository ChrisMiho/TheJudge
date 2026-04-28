import pino from "pino";

export type LogPayload = Record<string, unknown>;

export type AppLogger = {
  info: (event: string, payload?: LogPayload) => void;
  error: (event: string, payload?: LogPayload) => void;
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export function resolveDebugLoggingEnabled(rawValue: string | undefined, nodeEnv: string | undefined): boolean {
  const normalizedEnv = nodeEnv?.trim().toLowerCase();
  const defaultEnabled = normalizedEnv === "development";

  if (!rawValue || rawValue.trim().length === 0) {
    return defaultEnabled;
  }

  const normalizedValue = rawValue.trim().toLowerCase();
  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  throw new Error(
    `Invalid DEBUG_LOGGING value "${rawValue}". Expected true/false style value (for example: "true" or "false").`
  );
}

export function resolvePayloadLoggingEnabled(rawValue: string | undefined, nodeEnv: string | undefined): boolean {
  const normalizedEnv = nodeEnv?.trim().toLowerCase();
  const defaultEnabled = normalizedEnv === "development";

  if (!rawValue || rawValue.trim().length === 0) {
    return defaultEnabled;
  }

  const normalizedValue = rawValue.trim().toLowerCase();
  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  throw new Error(
    `Invalid LOG_PAYLOADS value "${rawValue}". Expected true/false style value (for example: "true" or "false").`
  );
}

export function createAppLogger(enabled: boolean): AppLogger {
  const logger = pino({
    base: { service: "thejudge-backend" },
    level: enabled ? "info" : "error",
    timestamp: pino.stdTimeFunctions.isoTime
  });

  return {
    info(event, payload = {}) {
      if (!enabled) {
        return;
      }
      logger.info({ event, ...payload });
    },
    error(event, payload = {}) {
      logger.error({ event, ...payload });
    }
  };
}

export function resolveCorrelationId(rawValue: string | string[] | undefined): string {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  return `srv-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
