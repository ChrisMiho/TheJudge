const DEFAULT_API_BASE_URL = "http://localhost:3000";

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

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
