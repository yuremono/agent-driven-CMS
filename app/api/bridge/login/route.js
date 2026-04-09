import { getBridge } from "../../../../lib/bridge.js";

export const runtime = "nodejs";

function enforceSameOrigin(request) {
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

export async function POST(request) {
  const forbidden = enforceSameOrigin(request);
  if (forbidden) return forbidden;

  const bridge = getBridge();
  const body = await request.json().catch(() => ({}));
  const type = body.type ?? "chatgpt";

  // Security: never accept API keys or external tokens from the browser.
  if (type !== "chatgpt") {
    return Response.json(
      { error: "only chatgpt login is supported from the browser" },
      { status: 400 },
    );
  }

  try {
    const result = await bridge.startChatgptLogin();
    return Response.json({ result, status: bridge.getStatus() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "failed to start login" },
      { status: 500 },
    );
  }
}
