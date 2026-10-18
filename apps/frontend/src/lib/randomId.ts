/**
 * A random id: a UUID where the browser has one, else `<prefix>-<time>-<random>`. The prefix names
 * the kind of id (`corr`, `inst`, `conv`) in that fallback form.
 */
export function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
