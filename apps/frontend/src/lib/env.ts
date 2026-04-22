const DEFAULT_API_BASE_URL = "http://localhost:3000";
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

export function resolveApiBaseUrl(rawValue: string | undefined): string {
  const candidate = rawValue?.trim() || DEFAULT_API_BASE_URL;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error(
      `Invalid VITE_API_URL value "${candidate}". Expected an absolute URL such as "http://localhost:3000".`
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(
      `Invalid VITE_API_URL protocol "${parsedUrl.protocol}". Only http and https are supported.`
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

export function resolveDebugLoggingEnabled(rawValue: string | undefined, isDev: boolean, mode?: string): boolean {
  const normalizedMode = mode?.trim().toLowerCase();
  const defaultEnabled = isDev && normalizedMode !== "test";

  if (!rawValue || rawValue.trim().length === 0) {
    return defaultEnabled;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid VITE_DEBUG_LOGGING value "${rawValue}". Expected true/false style value (for example: "true" or "false").`
  );
}

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
export const debugLoggingEnabled = resolveDebugLoggingEnabled(
  import.meta.env.VITE_DEBUG_LOGGING,
  import.meta.env.DEV,
  import.meta.env.MODE
);
