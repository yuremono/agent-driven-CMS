type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function errorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function jsonError(error: unknown, fallbackMessage: string, status = 500) {
  return Response.json({ error: errorMessage(error, fallbackMessage) }, { status });
}

export function sameOriginForbidden(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return null;

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: Request,
  fallback: T = {} as T,
): Promise<T> {
  return await request.json().catch(() => fallback);
}

export async function fetchJson<T = unknown>(
  path: string,
  init: RequestInit = {},
  fallbackMessage = "request failed",
): Promise<T> {
  const response = await fetch(path, init);
  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = isJsonObject(data) && typeof data.error === "string" ? data.error : fallbackMessage;
    throw new Error(message);
  }

  return data as T;
}
