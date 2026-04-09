export function errorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function jsonError(error, fallbackMessage, status = 500) {
  return Response.json({ error: errorMessage(error, fallbackMessage) }, { status });
}

export function sameOriginForbidden(request) {
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

export async function readJsonBody(request, fallback = {}) {
  return await request.json().catch(() => fallback);
}

export async function fetchJson(path, init = {}, fallbackMessage = "request failed") {
  const response = await fetch(path, init);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? fallbackMessage);
  }

  return data;
}
