export function asJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}

